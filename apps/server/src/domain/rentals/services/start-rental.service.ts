import { Effect, Option } from "effect";

import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { getDepositRequiredMinor, makePricingPolicyRepository } from "@/domain/pricing";
import { defectOn } from "@/domain/shared";
import { SubscriptionServiceTag } from "@/domain/subscriptions/services/subscription.service";
import { WalletHoldRepositoryError, WalletRepositoryError } from "@/domain/wallets/domain-errors";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalRow } from "../models";
import type { StartRentalInput } from "../types";

import {
  ActiveRentalExists,
  BikeAlreadyRented,
  BikeMissingStation,
  BikeNotFound,
  BikeNotFoundInStation,
  InsufficientBalanceToRent,
  UserWalletNotFound,
} from "../domain-errors";
import { startRentalFailureFromBikeStatus } from "../guards/bike-status";
import { makeRentalRepository, RentalRepository } from "../repository/rental.repository";
import { createRentalDepositHoldInTx } from "./rental-deposit-hold.service";
import { rentalUniqueViolationToFailure } from "./unique-violation-mapper";

export function startRental(
  input: StartRentalInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  Prisma | RentalRepository | BikeRepository | SubscriptionServiceTag
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* BikeRepository;
    const subscriptionService = yield* SubscriptionServiceTag;
    const { userId, bikeId, startStationId, startTime, subscriptionId } = input;

    const rental = yield* runPrismaTransaction(
      client,
      tx =>
        Effect.gen(function* () {
          const txBikeRepo = makeBikeRepository(tx);
          const txRentalRepo = makeRentalRepository(tx);
          const txPricingPolicyRepo = makePricingPolicyRepository(tx);

          const existingByUser = yield* txRentalRepo.findActiveByUserId(userId);
          if (Option.isSome(existingByUser)) {
            return yield* Effect.fail(new ActiveRentalExists({ userId }));
          }

          const existingByBike = yield* txRentalRepo.findActiveByBikeId(bikeId);
          if (Option.isSome(existingByBike)) {
            return yield* Effect.fail(new BikeAlreadyRented({ bikeId }));
          }

          const bikeOpt = yield* txBikeRepo.getById(bikeId);
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

          const pricingPolicy = yield* txPricingPolicyRepo.getActive().pipe(
            Effect.catchTag("ActivePricingPolicyNotFound", err => Effect.die(err)),
            Effect.catchTag("ActivePricingPolicyAmbiguous", err => Effect.die(err)),
          );

          const requiredBalance = getDepositRequiredMinor(pricingPolicy);
          if (subscriptionId) {
            yield* subscriptionService.useOneInTx(tx, {
              subscriptionId,
              userId,
              now: startTime,
            });
          }

          const booked = yield* txBikeRepo.bookBikeIfAvailable(bikeId, startTime);
          if (!booked) {
            const latestBike = yield* txBikeRepo.getById(bikeId);
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

          const created = yield* txRentalRepo.createRental({
            userId,
            bikeId,
            pricingPolicyId: pricingPolicy.id,
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
          );

          yield* createRentalDepositHoldInTx({
            tx,
            rentalId: created.id,
            userId,
            amount: requiredBalance,
          }).pipe(
            Effect.catchTag("WalletNotFound", () =>
              Effect.fail(new UserWalletNotFound({ userId }))),
            Effect.catchTag("InsufficientWalletBalance", ({ balance, attemptedDebit }) =>
              Effect.fail(new InsufficientBalanceToRent({
                userId,
                requiredBalance: Number(attemptedDebit),
                currentBalance: Number(balance),
              }))),
            defectOn(WalletRepositoryError, WalletHoldRepositoryError),
          );

          const rentalWithDepositHoldOpt = yield* txRentalRepo.findById(created.id);
          if (Option.isNone(rentalWithDepositHoldOpt)) {
            return yield* Effect.die(new Error(`Expected rental ${created.id} after deposit hold creation`));
          }

          return rentalWithDepositHoldOpt.value;
        }),
    ).pipe(
      defectOn(PrismaTransactionError),
    );

    return rental;
  });
}
