import { Effect, Option } from "effect";

import type { RentalStatus } from "generated/prisma/enums";

import { env } from "@/config/env";
import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { makeReservationRepository } from "@/domain/reservations/repository/reservation.repository";
import { toMinorUnit } from "@/domain/shared/money";
import {
  SubscriptionNotFound,
  SubscriptionUsageExceeded,
} from "@/domain/subscriptions/domain-errors";
import { SubscriptionRepository } from "@/domain/subscriptions/repository/subscription.repository";
import { SubscriptionServiceTag } from "@/domain/subscriptions/services/subscription.service";
import { WalletRepository, WalletServiceTag } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalRow } from "../models";
import type { EndRentalInput, StartRentalInput } from "../types";

import {
  ActiveRentalExists,
  BikeAlreadyRented,
  BikeMissingStation,
  BikeNotFound,
  BikeNotFoundInStation,
  EndStationMismatch,
  InsufficientBalanceToRent,
  InvalidRentalState,
  RentalNotFound,
  UserWalletNotFound,
} from "../domain-errors";
import { startRentalFailureFromBikeStatus } from "../guards/bike-status";
import { computeSubscriptionCoverage } from "../pricing";
import { makeRentalRepository, RentalRepository } from "../repository/rental.repository";
import { rentalUniqueViolationToFailure } from "../services/unique-violation-mapper";

export function startRentalUseCase(
  input: StartRentalInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  Prisma | RentalRepository | BikeRepository | WalletRepository | SubscriptionServiceTag
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* BikeRepository;
    const walletRepo = yield* WalletRepository;
    const subscriptionService = yield* SubscriptionServiceTag;
    const { userId, bikeId, startStationId, startTime, subscriptionId } = input;

    const rental = yield* runPrismaTransaction(client, tx =>
      Effect.gen(function* () {
        const txBikeRepo = makeBikeRepository(tx);
        const txRentalRepo = makeRentalRepository(tx);

        const existingByUser = yield* txRentalRepo.findActiveByUserId(userId).pipe(
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );
        if (Option.isSome(existingByUser)) {
          return yield* Effect.fail(new ActiveRentalExists({ userId }));
        }

        const existingByBike = yield* txRentalRepo.findActiveByBikeId(bikeId).pipe(
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );
        if (Option.isSome(existingByBike)) {
          return yield* Effect.fail(new BikeAlreadyRented({ bikeId }));
        }

        const bikeOpt = yield* txBikeRepo.getById(bikeId).pipe(
          Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
        );
        if (Option.isNone(bikeOpt)) {
          return yield* Effect.fail(new BikeNotFound({ bikeId }));
        }
        const bike = bikeOpt.value;

        if (!bike.stationId) {
          return yield* Effect.fail(new BikeMissingStation({ bikeId }));
        }
        if (bike.stationId !== startStationId) {
          return yield* Effect.fail(new BikeNotFoundInStation({ bikeId, stationId: startStationId }));
        }

        const bikeStatusFailure = startRentalFailureFromBikeStatus({
          bikeId,
          status: bike.status,
        });
        if (Option.isSome(bikeStatusFailure)) {
          return yield* Effect.fail(bikeStatusFailure.value);
        }

        const walletOpt = yield* walletRepo.findByUserIdInTx(tx, userId).pipe(
          Effect.catchTag("WalletRepositoryError", err => Effect.die(err)),
        );
        if (Option.isNone(walletOpt)) {
          return yield* Effect.fail(new UserWalletNotFound({ userId }));
        }
        const wallet = walletOpt.value;

        const currentBalance = Number(wallet.balance.toString());
        const requiredBalance = env.MIN_WALLET_BALANCE_TO_RENT;
        if (Number.isNaN(currentBalance) || currentBalance < requiredBalance) {
          return yield* Effect.fail(new InsufficientBalanceToRent({
            userId,
            requiredBalance,
            currentBalance: Number.isNaN(currentBalance) ? 0 : currentBalance,
          }));
        }

        if (subscriptionId) {
          yield* subscriptionService.useOneInTx(tx, {
            subscriptionId,
            userId,
            now: startTime,
          }).pipe(
            Effect.catchTag("SubscriptionRepositoryError", err => Effect.die(err)),
          );
        }

        const booked = yield* txBikeRepo.bookBikeIfAvailable(bikeId, startTime).pipe(
          Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
        );
        if (!booked) {
          const latestBike = yield* txBikeRepo.getById(bikeId).pipe(
            Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
          );
          if (Option.isNone(latestBike)) {
            return yield* Effect.fail(new BikeNotFound({ bikeId }));
          }
          const failure = startRentalFailureFromBikeStatus({
            bikeId,
            status: latestBike.value.status,
          });
          if (Option.isSome(failure)) {
            return yield* Effect.fail(failure.value);
          }
          return yield* Effect.fail(new BikeAlreadyRented({ bikeId }));
        }

        // TODO: Reservation integration (if started from reservation):
        // - ensure reservation belongs to user and is active
        // - mark reservation consumed/expired appropriately
        // - apply reservation prepaid deduction to end-rental pricing

        const rental = yield* txRentalRepo.createRental({
          userId,
          bikeId,
          startStationId,
          startTime,
          subscriptionId: subscriptionId ?? null,
        }).pipe(
          Effect.catchTag(
            "RentalUniqueViolation",
            ({ constraint }): Effect.Effect<never, RentalServiceFailure> => {
              const mapped = rentalUniqueViolationToFailure({
                constraint,
                bikeId,
                userId,
              });
              if (Option.isSome(mapped)) {
                return Effect.fail(mapped.value);
              }

              return Effect.die(new Error(
                `Unhandled rental unique constraint: ${String(constraint)}`,
              ));
            },
          ),
          Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
        );

        return rental;
      })).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    return rental;
  });
}

export function endRentalUseCase(
  input: EndRentalInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  | Prisma
  | RentalRepository
  | BikeRepository
  | WalletServiceTag
  | SubscriptionRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const repo = yield* RentalRepository;
    yield* BikeRepository;
    const subscriptionRepo = yield* SubscriptionRepository;
    const walletService = yield* WalletServiceTag;
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

    // TODO: Reservation prepaid deduction (reservation domain)
    // TODO: SOS/unsolvable exemptions (SOS domain)

    const updated = yield* runPrismaTransaction(client, tx =>
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
          const subscriptionOpt = yield* subscriptionRepo.findByIdInTx(
            tx,
            current.subscriptionId,
          ).pipe(Effect.catchTag("SubscriptionRepositoryError", err => Effect.die(err)));

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
            const incremented = yield* subscriptionRepo.incrementUsageInTx(
              tx,
              subscription.id,
              subscription.usageCount,
              usageToAdd,
              ["ACTIVE", "PENDING"],
            ).pipe(Effect.catchTag("SubscriptionRepositoryError", err => Effect.die(err)));

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
          yield* walletService.debitWalletInTx(tx, {
            userId,
            amount: BigInt(totalPrice),
            description: `Rental ${rentalId}`,
            hash: `rental:${rentalId}`,
            type: "DEBIT",
          }).pipe(
            Effect.catchTag("WalletNotFound", () =>
              Effect.fail(new UserWalletNotFound({ userId }))),
            Effect.catchTag("InsufficientWalletBalance", ({ balance, attemptedDebit }) =>
              Effect.fail(new InsufficientBalanceToRent({
                userId,
                requiredBalance: Number(attemptedDebit),
                currentBalance: Number(balance),
              }))),
            Effect.catchTag("WalletRepositoryError", err => Effect.die(err)),
          );
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
        }).pipe(
          Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
        );
      })).pipe(
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
