import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect, Option } from "effect";

import type { BikeRepository } from "@/domain/bikes";
import type { SubscriptionNotFound, SubscriptionNotUsable, SubscriptionUsageExceeded } from "@/domain/subscriptions/domain-errors";
import type { WalletBalanceConstraint } from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { ReservationOption } from "generated/prisma/client";

import { env } from "@/config/env";
import { makeBikeRepository } from "@/domain/bikes";
import { getReservationFeeMinor, makePricingPolicyRepository } from "@/domain/pricing";
import { PricingPolicyRepositoryError } from "@/domain/pricing/domain-errors";
import { ReservationRepositoryError } from "@/domain/reservations/domain-errors";
import { defectOn } from "@/domain/shared";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import { makeStationRepository } from "@/domain/stations";
import { StationRepositoryError } from "@/domain/stations/errors";
import { SubscriptionRepositoryError } from "@/domain/subscriptions/domain-errors";
import { SubscriptionServiceTag } from "@/domain/subscriptions/services/subscription.service";
import { makeUserQueryRepository } from "@/domain/users";
import { UserRepositoryError } from "@/domain/users/domain-errors";
import { makeWalletRepository } from "@/domain/wallets";
import { InsufficientWalletBalance, WalletNotFound, WalletRepositoryError } from "@/domain/wallets/domain-errors";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";
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
  StationPickupSlotLimitExceeded,
  SubscriptionRequired,
} from "../domain-errors";
import { makeReservationRepository } from "../repository/reservation.repository";
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
const RESERVATION_TIME_ZONE = "Asia/Ho_Chi_Minh";

function computeEndTime(startTime: Date, holdMinutes = HOLD_MINUTES): Date {
  return new Date(startTime.getTime() + holdMinutes * 60 * 1000);
}

function formatReservationDateTime(value: Date): string {
  return value.toLocaleString("vi-VN", { timeZone: RESERVATION_TIME_ZONE });
}

export function reserveBike(
  input: ReserveBikeInput,
): Effect.Effect<
  ReservationRow,
  ReserveBikeFailure,
  | Prisma
  | ReservationServiceTag
  | ReservationHoldServiceTag
  | BikeRepository
  | SubscriptionServiceTag
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const reservationService = yield* ReservationServiceTag;
    const reservationHoldService = yield* ReservationHoldServiceTag;
    const subscriptionService = yield* SubscriptionServiceTag;
    const now = input.now ?? new Date();

    const reservation = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const bikeRepo = makeBikeRepository(tx);
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

        const bikeOpt = yield* bikeRepo.getById(input.bikeId);
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

        const txStationRepo = makeStationRepository(tx);
        const txReservationRepo = makeReservationRepository(tx);
        const stationOpt = yield* txStationRepo.getById(input.stationId).pipe(
          defectOn(StationRepositoryError),
        );
        if (Option.isNone(stationOpt)) {
          return yield* Effect.die(new Error(
            `Invariant violated: bike ${input.bikeId} references missing station ${input.stationId}`,
          ));
        }

        const pendingReservations = yield* txReservationRepo.countPendingByStationId(input.stationId).pipe(
          defectOn(ReservationRepositoryError),
        );
        if (pendingReservations >= stationOpt.value.pickupSlotLimit) {
          return yield* Effect.fail(new StationPickupSlotLimitExceeded({
            stationId: input.stationId,
            pickupSlotLimit: stationOpt.value.pickupSlotLimit,
            pendingReservations,
          }));
        }

        const subscriptionId: string | null = input.subscriptionId ?? null;
        const pricingPolicy = yield* makePricingPolicyRepository(tx).getActive().pipe(
          defectOn(PricingPolicyRepositoryError),
          Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
          Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
        );

        let prepaidMinor = getReservationFeeMinor(pricingPolicy);
        let prepaid = toPrismaDecimal(prepaidMinor.toString());

        if (input.reservationOption === "SUBSCRIPTION") {
          if (!subscriptionId) {
            return yield* Effect.fail(new SubscriptionRequired({ userId: input.userId }));
          }
          yield* subscriptionService.useOneInTx(tx, {
            subscriptionId,
            userId: input.userId,
            now,
          }).pipe(
            defectOn(SubscriptionRepositoryError),
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
          pricingPolicyId: pricingPolicy.id,
        });

        const bikeReserved = yield* bikeRepo.reserveBikeIfAvailable(input.bikeId, now);
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

        // Confirmation email uses the older "success-reservation" template name.
        // TODO(env): Provide a real callback URL once we standardize a `FRONTEND_URL`/`APP_WEB_URL` env.
        // TODO(iot): send reservation "reserve" command once IoT integration is ready.
        {
          const txUserRepo = makeUserQueryRepository(tx);
          const [userOpt, stationOpt] = yield* Effect.all([
            txUserRepo.findById(reservation.userId).pipe(
              defectOn(UserRepositoryError),
            ),
            txStationRepo.getById(reservation.stationId).pipe(
              defectOn(StationRepositoryError),
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
      defectOn(PrismaTransactionError),
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
    defectOn(WalletRepositoryError),
  );
}
