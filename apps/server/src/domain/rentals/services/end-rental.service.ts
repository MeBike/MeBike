import { Effect, Option } from "effect";

import type { WalletBalanceConstraint } from "@/domain/wallets/domain-errors";
import type { DecreaseBalanceInput } from "@/domain/wallets/models";
import type { RentalStatus } from "generated/prisma/enums";

import { env } from "@/config/env";
import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { makeReservationRepository } from "@/domain/reservations/repository/reservation.repository";
import { toMinorUnit } from "@/domain/shared/money";
import {
  SubscriptionNotFound,
  SubscriptionUsageExceeded,
} from "@/domain/subscriptions/domain-errors";
import { makeSubscriptionRepository, SubscriptionRepository } from "@/domain/subscriptions/repository/subscription.repository";
import { makeWalletRepository } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalRow } from "../models";
import type { EndRentalInput } from "../types";

import {
  BikeNotFound,
  EndStationMismatch,
  InsufficientBalanceToRent,
  InvalidRentalState,
  RentalNotFound,
  UserWalletNotFound,
} from "../domain-errors";
import { computeSubscriptionCoverage } from "../pricing";
import { makeRentalRepository, RentalRepository } from "../repository/rental.repository";

export function endRentalUseCase(
  input: EndRentalInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  | Prisma
  | RentalRepository
  | BikeRepository
  | SubscriptionRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const repo = yield* RentalRepository;
    yield* BikeRepository;
    yield* SubscriptionRepository;
    const { userId, rentalId, endStationId, endTime } = input;

    const currentOpt = yield* repo.getMyRentalById(userId, rentalId).pipe(
      Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
    );

    if (Option.isNone(currentOpt)) {
      return yield* Effect.fail(new RentalNotFound({ rentalId, userId }));
    }

    const current = currentOpt.value;

    if (current.status !== "RENTED") {
      return yield* Effect.fail(
        new InvalidRentalState({
          rentalId,
          from: current.status,
          to: "COMPLETED" as RentalStatus,
        }),
      );
    }

    if (current.startStationId !== endStationId) {
      return yield* Effect.fail(
        new EndStationMismatch({
          rentalId,
          startStationId: current.startStationId ?? null,
          attemptedEndStationId: endStationId,
        }),
      );
    }

    if (!current.bikeId) {
      return yield* Effect.fail(new BikeNotFound({ bikeId: "unknown" }));
    }
    const bikeId = current.bikeId;

    const durationMinutes = Math.max(
      1,
      Math.floor(
        (endTime.getTime() - new Date(current.startTime).getTime()) / 60000,
      ),
    );

    const updated = yield* runPrismaTransaction(
      client,
      tx =>
        Effect.gen(function* () {
          const txBikeRepo = makeBikeRepository(tx);
          const txRentalRepo = makeRentalRepository(tx);
          let basePrice = Math.ceil(durationMinutes / 30) * env.PRICE_PER_30_MINS;
          const durationHours = durationMinutes / 60;
          let usageToAdd = 0;
          let prepaidMinor = 0n;

          const txReservationRepo = makeReservationRepository(tx);
          const reservationOpt = yield* txReservationRepo.findById(rentalId).pipe(
            Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
          );
          if (Option.isSome(reservationOpt)) {
            prepaidMinor = toMinorUnit(reservationOpt.value.prepaid);
          }

          if (current.subscriptionId) {
            const txSubscriptionRepo = makeSubscriptionRepository(tx);

            const subscriptionOpt = yield* txSubscriptionRepo.findById(current.subscriptionId).pipe(
              Effect.catchTag("SubscriptionRepositoryError", err => Effect.die(err)),
            );

            if (Option.isNone(subscriptionOpt)) {
              return yield* Effect.fail(new SubscriptionNotFound({
                subscriptionId: current.subscriptionId,
              }));
            }

            const subscription = subscriptionOpt.value;
            const coverage = yield* computeSubscriptionCoverage({
              durationMinutes,
              subscription,
              userId,
            });
            basePrice = coverage.basePrice;
            usageToAdd = coverage.usageToAdd;

            if (usageToAdd > 0) {
              const incremented = yield* txSubscriptionRepo.incrementUsage(
                subscription.id,
                subscription.usageCount,
                usageToAdd,
                ["ACTIVE", "PENDING"],
              ).pipe(
                Effect.catchTag("SubscriptionRepositoryError", err => Effect.die(err)),
              );

              if (Option.isNone(incremented)) {
                return yield* Effect.fail(new SubscriptionUsageExceeded({
                  subscriptionId: subscription.id,
                  usageCount: subscription.usageCount,
                  maxUsages: subscription.maxUsages ?? subscription.usageCount,
                }));
              }
            }
          }

          const penaltyAmount = durationHours > env.RENTAL_PENALTY_HOURS
            ? env.RENTAL_PENALTY_AMOUNT
            : 0;
          const totalPrice = Math.max(
            0,
            basePrice + penaltyAmount - Number(prepaidMinor),
          );

          if (totalPrice > 0) {
            yield* debitWallet(makeWalletRepository(tx), {
              userId,
              amount: BigInt(totalPrice),
              description: `Rental ${rentalId}`,
              hash: `rental:${rentalId}`,
              type: "DEBIT",
            });
          }

          const updatedBike = yield* txBikeRepo.updateStatusAt(bikeId, "AVAILABLE", endTime).pipe(
            Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
          );
          if (Option.isNone(updatedBike)) {
            return yield* Effect.fail(new BikeNotFound({ bikeId }));
          }

          if (Option.isSome(reservationOpt) && reservationOpt.value.status === "ACTIVE") {
            yield* txReservationRepo.expireActive(reservationOpt.value.id, endTime).pipe(
              Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
            );
          }

          return yield* txRentalRepo.updateRentalOnEnd({
            rentalId,
            endStationId,
            endTime,
            durationMinutes,
            totalPrice,
            newStatus: "COMPLETED",
          }).pipe(Effect.catchTag("RentalRepositoryError", error => Effect.die(error)));
        }),
    ).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    if (Option.isNone(updated)) {
      return yield* Effect.fail(
        new InvalidRentalState({
          rentalId,
          from: current.status,
          to: "COMPLETED",
        }),
      );
    }

    return updated.value;
  });
}

function debitWallet(
  repo: ReturnType<typeof makeWalletRepository>,
  input: DecreaseBalanceInput,
) {
  return repo.decreaseBalance(input).pipe(
    Effect.catchTag("WalletRecordNotFound", () =>
      Effect.fail(new UserWalletNotFound({ userId: input.userId }))),
    Effect.catchTag("WalletBalanceConstraint", (err: WalletBalanceConstraint) =>
      Effect.fail(new InsufficientBalanceToRent({
        userId: err.userId,
        requiredBalance: Number(err.attemptedDebit),
        currentBalance: Number(err.balance),
      }))),
    Effect.catchTag("WalletRepositoryError", err => Effect.die(err)),
  );
}
