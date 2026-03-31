import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Option } from "effect";

import type { JobProducer, QueueJob } from "@/infrastructure/jobs/ports";

import { BikeRepository, BikeRepositoryLive, makeBikeRepository } from "@/domain/bikes";
import { BikeRepositoryError } from "@/domain/bikes/domain-errors";
import { ReservationRepositoryError } from "@/domain/reservations/domain-errors";
import {
  makeReservationRepository,
  ReservationRepository,
  ReservationRepositoryLive,
} from "@/domain/reservations/repository/reservation.repository";
import { defectOn } from "@/domain/shared";
import { StationRepositoryError } from "@/domain/stations/errors";
import {
  StationRepository,
  StationRepositoryLive,
} from "@/domain/stations/repository/station.repository";
import { UserRepositoryError } from "@/domain/users/domain-errors";
import {
  UserQueryRepository,
  UserQueryRepositoryLive,
} from "@/domain/users/repository/user-query.repository";
import { sendJob } from "@/infrastructure/jobs/send-job";
import { Prisma, PrismaLive } from "@/infrastructure/prisma";
import {
  buildReservationExpiredEmail,
  buildReservationNearExpiryEmail,
} from "@/lib/email-templates";
import logger from "@/lib/logger";

type ReservationWorkerDeps
  = | ReservationRepository
    | BikeRepository
    | UserQueryRepository
    | StationRepository
    | Prisma;

function runReservationEffect<A, E>(
  eff: Effect.Effect<A, E, ReservationWorkerDeps>,
): Promise<A> {
  return Effect.runPromise(
    eff.pipe(
      Effect.provide(ReservationRepositoryLive),
      Effect.provide(BikeRepositoryLive),
      Effect.provide(UserQueryRepositoryLive),
      Effect.provide(StationRepositoryLive),
      Effect.provide(PrismaLive),
    ),
  );
}

export async function handleReservationNotifyNearExpiry(
  job: QueueJob | undefined,
  producer: JobProducer,
): Promise<void> {
  if (!job) {
    logger.warn("Reservation notify worker received empty batch");
    return;
  }

  let payload: { reservationId: string };
  try {
    payload = parseJobPayload(JobTypes.ReservationNotifyNearExpiry, job.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Invalid reservation notify payload");
    throw err;
  }

  const result = await runReservationEffect(
    Effect.gen(function* () {
      const reservationRepo = yield* ReservationRepository;
      const userRepo = yield* UserQueryRepository;
      const stationRepo = yield* StationRepository;
      const now = new Date();

      const reservationOpt = yield* reservationRepo.findById(payload.reservationId).pipe(
        defectOn(ReservationRepositoryError),
      );
      if (Option.isNone(reservationOpt)) {
        return { outcome: "NOT_FOUND" as const };
      }
      const reservation = reservationOpt.value;

      if (reservation.status !== "PENDING") {
        return { outcome: "SKIPPED", reason: "NOT_PENDING" as const };
      }
      if (!reservation.endTime || reservation.endTime <= now) {
        return { outcome: "SKIPPED", reason: "NOT_DUE" as const };
      }
      if (!reservation.bikeId) {
        return { outcome: "SKIPPED", reason: "MISSING_BIKE" as const };
      }

      const userOpt = yield* userRepo.findById(reservation.userId).pipe(
        defectOn(UserRepositoryError),
      );
      if (Option.isNone(userOpt)) {
        return { outcome: "SKIPPED", reason: "MISSING_USER" as const };
      }
      const user = userOpt.value;

      const stationOpt = yield* stationRepo.getById(reservation.stationId).pipe(
        defectOn(StationRepositoryError),
      );
      if (Option.isNone(stationOpt)) {
        return { outcome: "SKIPPED", reason: "MISSING_STATION" as const };
      }
      const station = stationOpt.value;

      const minutesRemaining = Math.ceil(
        (reservation.endTime.getTime() - now.getTime()) / (60 * 1000),
      );
      const email = buildReservationNearExpiryEmail({
        fullName: user.fullname,
        stationName: station.name,
        bikeId: reservation.bikeId,
        minutesRemaining,
      });

      yield* Effect.tryPromise({
        try: () =>
          sendJob(
            producer,
            JobTypes.EmailSend,
            {
              version: 1,
              kind: "raw",
              to: user.email,
              subject: email.subject,
              html: email.html,
            },
            {
              dedupeKey: `reservation:near-expiry:${reservation.id}`,
            },
          ),
        catch: err => err as unknown,
      }).pipe(Effect.catchAll(err => Effect.die(err)));

      yield* Effect.tryPromise({
        try: () =>
          sendJob(
            producer,
            JobTypes.PushSend,
            {
              version: 1,
              userId: reservation.userId,
              event: "reservations.nearExpiry",
              title: "Reservation expiring soon",
              body: `Your bike reservation at ${station.name} expires in about ${minutesRemaining} minute(s).`,
              channelId: "default",
              data: {
                reservationId: reservation.id,
                event: "reservations.nearExpiry",
              },
            },
            {
              dedupeKey: `reservation:near-expiry:push:${reservation.id}`,
            },
          ),
        catch: err => err as unknown,
      }).pipe(Effect.catchAll(err => Effect.die(err)));

      return { outcome: "NOTIFIED" as const };
    }),
  );

  logger.info(
    { jobId: job.id, reservationId: payload.reservationId, result },
    "reservations.notifyNearExpiry processed",
  );
}

export async function handleReservationExpireHold(
  job: QueueJob | undefined,
  producer: JobProducer,
): Promise<void> {
  if (!job) {
    logger.warn("Reservation expire worker received empty batch");
    return;
  }

  let payload: { reservationId: string };
  try {
    payload = parseJobPayload(JobTypes.ReservationExpireHold, job.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Invalid reservation expire payload");
    throw err;
  }

  const result = await runReservationEffect(
    Effect.gen(function* () {
      yield* BikeRepository;
      const userRepo = yield* UserQueryRepository;
      const stationRepo = yield* StationRepository;
      const { client } = yield* Prisma;
      const now = new Date();

      const outcome = yield* Effect.tryPromise({
        try: async () => {
          return await client.$transaction(async (tx) => {
            const txBikeRepo = makeBikeRepository(tx);
            const txReservationRepo = makeReservationRepository(tx);
            const reservationOpt = await Effect.runPromise(
              txReservationRepo.findById(payload.reservationId).pipe(
                defectOn(ReservationRepositoryError),
              ),
            );

            if (Option.isNone(reservationOpt)) {
              return { outcome: "NOT_FOUND" as const };
            }

            const reservation = reservationOpt.value;
            if (reservation.status !== "PENDING") {
              return { outcome: "SKIPPED" as const, reason: "NOT_PENDING" as const };
            }
            if (!reservation.endTime || reservation.endTime > now) {
              return { outcome: "SKIPPED" as const, reason: "NOT_DUE" as const };
            }
            if (!reservation.bikeId) {
              return { outcome: "SKIPPED" as const, reason: "MISSING_BIKE" as const };
            }

            const expired = await Effect.runPromise(
              txReservationRepo.expirePendingHold(reservation.id, now).pipe(
                defectOn(ReservationRepositoryError),
              ),
            );
            if (!expired) {
              return { outcome: "SKIPPED" as const, reason: "ALREADY_HANDLED" as const };
            }

            await Effect.runPromise(
              txBikeRepo.releaseBikeIfReserved(reservation.bikeId, now).pipe(
                defectOn(BikeRepositoryError),
              ),
            );

            return {
              outcome: "EXPIRED" as const,
              reservationId: reservation.id,
              userId: reservation.userId,
              stationId: reservation.stationId,
              bikeId: reservation.bikeId,
              endTime: reservation.endTime,
            };
          });
        },
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll(err => Effect.die(err)),
      );

      if (outcome.outcome !== "EXPIRED") {
        return outcome;
      }

      const userOpt = yield* userRepo.findById(outcome.userId).pipe(
        defectOn(UserRepositoryError),
      );
      if (Option.isNone(userOpt)) {
        return { outcome: "SKIPPED" as const, reason: "MISSING_USER" as const };
      }
      const user = userOpt.value;

      const stationOpt = yield* stationRepo.getById(outcome.stationId).pipe(
        defectOn(StationRepositoryError),
      );
      if (Option.isNone(stationOpt)) {
        return { outcome: "SKIPPED" as const, reason: "MISSING_STATION" as const };
      }
      const station = stationOpt.value;

      const endTimeLabel = outcome.endTime.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
      const email = buildReservationExpiredEmail({
        fullName: user.fullname,
        stationName: station.name,
        bikeId: outcome.bikeId,
        endTimeLabel,
      });

      yield* Effect.tryPromise({
        try: () =>
          sendJob(
            producer,
            JobTypes.EmailSend,
            {
              version: 1,
              kind: "raw",
              to: user.email,
              subject: email.subject,
              html: email.html,
            },
            {
              dedupeKey: `reservation:expired:${outcome.reservationId}`,
            },
          ),
        catch: err => err as unknown,
      }).pipe(Effect.catchAll(err => Effect.die(err)));

      yield* Effect.tryPromise({
        try: () =>
          sendJob(
            producer,
            JobTypes.PushSend,
            {
              version: 1,
              userId: outcome.userId,
              event: "reservations.expired",
              title: "Reservation expired",
              body: `Your bike reservation at ${station.name} has expired.`,
              channelId: "default",
              data: {
                reservationId: outcome.reservationId,
                event: "reservations.expired",
              },
            },
            {
              dedupeKey: `reservation:expired:push:${outcome.reservationId}`,
            },
          ),
        catch: err => err as unknown,
      }).pipe(Effect.catchAll(err => Effect.die(err)));

      return { outcome: "EXPIRED_NOTIFIED" as const };
    }),
  );

  logger.info(
    { jobId: job.id, reservationId: payload.reservationId, result },
    "reservations.expireHold processed",
  );
}
