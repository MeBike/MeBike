import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";
import type {
  SubscriptionNotFound,
  SubscriptionNotUsable,
  SubscriptionUsageExceeded,
} from "@/domain/subscriptions/domain-errors";
import type { WalletBalanceConstraint } from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { ReservationOption } from "generated/prisma/client";

import { env } from "@/config/env";
import { makeBikeRepository } from "@/domain/bikes";
import { makeRentalRepository, RentalRepository } from "@/domain/rentals";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import { toMinorUnit } from "@/domain/shared/money";
import { StationRepository } from "@/domain/stations";
import { SubscriptionServiceTag } from "@/domain/subscriptions/services/subscription.service";
import { makeUserRepository } from "@/domain/users";
import { makeWalletRepository } from "@/domain/wallets";
import { InsufficientWalletBalance, WalletNotFound } from "@/domain/wallets/domain-errors";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";
import { buildReservationConfirmedEmail } from "@/lib/email-templates";

import type { ReservationServiceFailure } from "../domain-errors";
import type { ReservationRow } from "../models";

import {
  ActiveReservationExists,
  BikeAlreadyReserved,
  BikeNotAvailable,
  BikeNotFound,
  BikeNotFoundInStation,
  ReservationOptionNotSupported,
  SubscriptionRequired,
} from "../domain-errors";
import { ReservationHoldServiceTag } from "../services/reservation-hold.service";
import { ReservationServiceTag } from "../services/reservation.service";

export type ReserveBikeInput = {
  readonly userId: string;
  readonly bikeId: string;
  readonly stationId: string;
  readonly startTime: Date;
  readonly reservationOption: ReservationOption;
  readonly subscriptionId?: string | null;
  readonly endTime?: Date | null;
  readonly now?: Date;
};

export type ReserveBikeFailure
  = | ReservationServiceFailure
    | SubscriptionNotFound
    | SubscriptionNotUsable
    | SubscriptionUsageExceeded
    | WalletNotFound
    | InsufficientWalletBalance;

const HOLD_MINUTES = env.RESERVATION_HOLD_MINUTES;
const PREPAID_AMOUNT = env.RESERVATION_PREPAID_AMOUNT;
const RESERVATION_TIME_ZONE = "Asia/Ho_Chi_Minh";

function computeEndTime(startTime: Date, holdMinutes = HOLD_MINUTES): Date {
  return new Date(startTime.getTime() + holdMinutes * 60 * 1000);
}

function formatReservationDateTime(value: Date): string {
  return value.toLocaleString("vi-VN", { timeZone: RESERVATION_TIME_ZONE });
}

export function reserveBikeUseCase(
  input: ReserveBikeInput,
): Effect.Effect<
  ReservationRow,
  ReserveBikeFailure,
  | Prisma
  | ReservationServiceTag
  | ReservationHoldServiceTag
  | BikeRepository
  | StationRepository
  | SubscriptionServiceTag
  | RentalRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const reservationService = yield* ReservationServiceTag;
    const reservationHoldService = yield* ReservationHoldServiceTag;
    const stationRepo = yield* StationRepository;
    const subscriptionService = yield* SubscriptionServiceTag;
    yield* RentalRepository;
    const now = input.now ?? new Date();

    const reservation = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const bikeRepo = makeBikeRepository(tx);
        const txRentalRepo = makeRentalRepository(tx);
        if (input.reservationOption === "FIXED_SLOT") {
          return yield* Effect.fail(
            new ReservationOptionNotSupported({ option: input.reservationOption }),
          );
        }

        const existingByUser = yield* reservationHoldService.getCurrentHoldForUserNowInTx(
          tx,
          input.userId,
          now,
        );
        if (Option.isSome(existingByUser)) {
          return yield* Effect.fail(new ActiveReservationExists({ userId: input.userId }));
        }

        const activeReservation = yield* reservationService.getLatestPendingOrActiveForUserInTx(
          tx,
          input.userId,
        );
        if (Option.isSome(activeReservation)) {
          return yield* Effect.fail(new ActiveReservationExists({ userId: input.userId }));
        }

        const existingByBike = yield* reservationHoldService.getCurrentHoldForBikeNowInTx(
          tx,
          input.bikeId,
          now,
        );
        if (Option.isSome(existingByBike)) {
          return yield* Effect.fail(new BikeAlreadyReserved({ bikeId: input.bikeId }));
        }

        const bikeOpt = yield* bikeRepo.getById(input.bikeId).pipe(
          Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
        );
        if (Option.isNone(bikeOpt)) {
          return yield* Effect.fail(new BikeNotFound({ bikeId: input.bikeId }));
        }
        const bike = bikeOpt.value;

        if (!bike.stationId || bike.stationId !== input.stationId) {
          return yield* Effect.fail(new BikeNotFoundInStation({
            bikeId: input.bikeId,
            stationId: input.stationId,
          }));
        }

        if (bike.status !== "AVAILABLE") {
          return yield* Effect.fail(new BikeNotAvailable({
            bikeId: input.bikeId,
            status: bike.status,
          }));
        }

        const subscriptionId: string | null = input.subscriptionId ?? null;
        let prepaid = toPrismaDecimal(PREPAID_AMOUNT);
        let prepaidMinor = toMinorUnit(prepaid);

        if (input.reservationOption === "SUBSCRIPTION") {
          if (!subscriptionId) {
            return yield* Effect.fail(new SubscriptionRequired({ userId: input.userId }));
          }
          yield* subscriptionService.useOneInTx(tx, {
            subscriptionId,
            userId: input.userId,
            now,
          }).pipe(
            Effect.catchTag("SubscriptionRepositoryError", err => Effect.die(err)),
          );

          prepaid = toPrismaDecimal("0");
          prepaidMinor = 0n;
        }
        else {
          yield* debitWallet(makeWalletRepository(tx), {
            userId: input.userId,
            amount: prepaidMinor,
            description: `Reservation prepaid ${input.userId}`,
          });
        }

        const endTime = input.endTime ?? computeEndTime(input.startTime);

        const reservation = yield* reservationService.reserveHoldInTx(tx, {
          userId: input.userId,
          bikeId: input.bikeId,
          stationId: input.stationId,
          reservationOption: input.reservationOption,
          subscriptionId,
          startTime: input.startTime,
          endTime,
          prepaid,
        });

        yield* txRentalRepo.createReservedRentalForReservation({
          reservationId: reservation.id,
          userId: reservation.userId,
          bikeId: reservation.bikeId ?? input.bikeId,
          startStationId: reservation.stationId,
          startTime: reservation.startTime,
          subscriptionId: reservation.subscriptionId ?? null,
        }).pipe(
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
          Effect.catchTag("RentalUniqueViolation", err => Effect.die(err)),
        );

        const bikeReserved = yield* bikeRepo.reserveBikeIfAvailable(input.bikeId, now).pipe(
          Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
        );
        if (!bikeReserved) {
          return yield* Effect.fail(new BikeAlreadyReserved({ bikeId: input.bikeId }));
        }

        if (reservation.endTime) {
          const notifyAtMs = reservation.endTime.getTime()
            - env.EXPIRY_NOTIFY_MINUTES * 60 * 1000;
          const notifyAt = new Date(Math.max(now.getTime(), notifyAtMs));
          const expireAt = new Date(Math.max(now.getTime(), reservation.endTime.getTime()));

          yield* enqueueOutboxJobInTx(tx, {
            type: JobTypes.ReservationNotifyNearExpiry,
            payload: {
              version: 1,
              reservationId: reservation.id,
            },
            runAt: notifyAt,
            dedupeKey: `reservation:notify:${reservation.id}`,
          });

          yield* enqueueOutboxJobInTx(tx, {
            type: JobTypes.ReservationExpireHold,
            payload: {
              version: 1,
              reservationId: reservation.id,
            },
            runAt: expireAt,
            dedupeKey: `reservation:expire:${reservation.id}`,
          });
        }

        // Confirmation email (legacy: "success-reservation").
        // TODO(env): Provide a real callback URL once we standardize a `FRONTEND_URL`/`APP_WEB_URL` env.
        // TODO(iot): send reservation "reserve" command once IoT integration is ready.
        {
          const txUserRepo = makeUserRepository(tx);
          const [userOpt, stationOpt] = yield* Effect.all([
            txUserRepo.findById(reservation.userId).pipe(
              Effect.catchTag("UserRepositoryError", err => Effect.die(err)),
            ),
            stationRepo.getByIdInTx(tx, reservation.stationId).pipe(
              Effect.catchTag("StationRepositoryError", err => Effect.die(err)),
            ),
          ]);

          if (Option.isNone(userOpt)) {
            return yield* Effect.die(new Error(
              `Invariant violated: reservation ${reservation.id} references missing user ${reservation.userId}`,
            ));
          }
          if (Option.isNone(stationOpt)) {
            return yield* Effect.die(new Error(
              `Invariant violated: reservation ${reservation.id} references missing station ${reservation.stationId}`,
            ));
          }

          const email = buildReservationConfirmedEmail({
            fullName: userOpt.value.fullname,
            stationName: stationOpt.value.name,
            bikeId: reservation.bikeId ?? input.bikeId,
            startTimeLabel: formatReservationDateTime(reservation.startTime),
            endTimeLabel: formatReservationDateTime(endTime),
          });

          yield* enqueueOutboxJobInTx(tx, {
            type: JobTypes.EmailSend,
            payload: {
              version: 1,
              to: userOpt.value.email,
              kind: "raw",
              subject: email.subject,
              html: email.html,
            },
            runAt: now,
            dedupeKey: `reservation-confirm:${reservation.id}`,
          });
        }

        return reservation;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    return reservation;
  });
}

function debitWallet(
  repo: ReturnType<typeof makeWalletRepository>,
  input: DecreaseBalanceInput,
) {
  return repo.decreaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new WalletNotFound({ userId: input.userId }))),
    Effect.catchTag("WalletBalanceConstraint", (err: WalletBalanceConstraint) =>
      Effect.fail(new InsufficientWalletBalance({
        walletId: err.walletId,
        userId: err.userId,
        balance: err.balance,
        attemptedDebit: err.attemptedDebit,
      }))),
    Effect.catchTag("WalletRepositoryError", err => Effect.die(err)),
  );
}
