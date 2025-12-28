import type { Job, PgBoss } from "pg-boss";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Option } from "effect";

import { BikeRepository, BikeRepositoryLive } from "@/domain/bikes";
import { RentalRepository, RentalRepositoryLive } from "@/domain/rentals";
import {
  ReservationRepository,
  ReservationRepositoryLive,
} from "@/domain/reservations/repository/reservation.repository";
import {
  StationRepository,
  StationRepositoryLive,
} from "@/domain/stations/repository/station.repository";
import {
  UserRepository,
  UserRepositoryLive,
} from "@/domain/users/repository/user.repository";
import { Prisma, PrismaLive } from "@/infrastructure/prisma";
import { buildReservationNearExpiryEmail } from "@/lib/email-templates";
import logger from "@/lib/logger";

type ReservationWorkerDeps
  = | ReservationRepository
    | BikeRepository
    | RentalRepository
    | UserRepository
    | StationRepository
    | Prisma;

function runReservationEffect<A, E>(
  eff: Effect.Effect<A, E, ReservationWorkerDeps>,
): Promise<A> {
  return Effect.runPromise(
    eff.pipe(
      Effect.provide(ReservationRepositoryLive),
      Effect.provide(BikeRepositoryLive),
      Effect.provide(RentalRepositoryLive),
      Effect.provide(UserRepositoryLive),
      Effect.provide(StationRepositoryLive),
      Effect.provide(PrismaLive),
    ),
  );
}

export async function handleReservationNotifyNearExpiry(
  job: Job<unknown> | undefined,
  boss: PgBoss,
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
      const userRepo = yield* UserRepository;
      const stationRepo = yield* StationRepository;
      const now = new Date();

      const reservationOpt = yield* reservationRepo.findById(payload.reservationId).pipe(
        Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
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
        Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
      );
      if (Option.isNone(userOpt)) {
        return { outcome: "SKIPPED", reason: "MISSING_USER" as const };
      }
      const user = userOpt.value;

      const stationOpt = yield* stationRepo.getById(reservation.stationId).pipe(
        Effect.catchTag("StationRepositoryError", err => Effect.die(err)),
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
          boss.send(
            JobTypes.EmailSend,
            {
              version: 1,
              kind: "raw",
              to: user.email,
              subject: email.subject,
              html: email.html,
            },
            {
              singletonKey: `reservation:near-expiry:${reservation.id}`,
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
  job: Job<unknown> | undefined,
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
      const reservationRepo = yield* ReservationRepository;
      const bikeRepo = yield* BikeRepository;
      const rentalRepo = yield* RentalRepository;
      const { client } = yield* Prisma;
      const now = new Date();

      const outcome = yield* Effect.tryPromise({
        try: async () => {
          return await client.$transaction(async (tx) => {
            const reservationOpt = await Effect.runPromise(
              reservationRepo.findByIdInTx(tx, payload.reservationId).pipe(
                Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
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
              reservationRepo.expirePendingHoldInTx(tx, reservation.id, now).pipe(
                Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
              ),
            );
            if (!expired) {
              return { outcome: "SKIPPED" as const, reason: "ALREADY_HANDLED" as const };
            }

            await Effect.runPromise(
              rentalRepo.cancelReservedRentalInTx(tx, reservation.id, now).pipe(
                Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
              ),
            );

            await Effect.runPromise(
              bikeRepo.releaseBikeIfReservedInTx(tx, reservation.bikeId, now).pipe(
                Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
              ),
            );

            return { outcome: "EXPIRED" as const };
          });
        },
        catch: err => err as unknown,
      }).pipe(
        Effect.catchAll(err => Effect.die(err)),
      );

      return outcome;
    }),
  );

  logger.info(
    { jobId: job.id, reservationId: payload.reservationId, result },
    "reservations.expireHold processed",
  );
}
