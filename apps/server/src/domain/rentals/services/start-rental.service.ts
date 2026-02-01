import { Effect, Option } from "effect";

import { env } from "@/config/env";
import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { SubscriptionServiceTag } from "@/domain/subscriptions/services/subscription.service";
import { WalletRepository } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

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
import { rentalUniqueViolationToFailure } from "./unique-violation-mapper";

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

    const rental = yield* runPrismaTransaction(
      client,
      tx =>
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

          const created = yield* txRentalRepo.createRental({
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

          return created;
        }),
    ).pipe(
      Effect.catchTag("PrismaTransactionError", err => Effect.die(err)),
    );

    return rental;
  });
}
