import { Effect, Match, Option } from "effect";

import type { RentalStatus } from "generated/prisma/enums";

import { env } from "@/config/env";
import { BikeRepository } from "@/domain/bikes";
import { WalletRepository } from "@/domain/wallets";
import { Prisma } from "@/infrastructure/prisma";

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
import { RentalRepository } from "../repository/rental.repository";
import { rentalUniqueViolationToFailure } from "./unique-violation-mapper";

export function startRentalUseCase(
  input: StartRentalInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  Prisma | RentalRepository | BikeRepository | WalletRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const rentalRepo = yield* RentalRepository;
    const bikeRepo = yield* BikeRepository;
    const walletRepo = yield* WalletRepository;
    const { userId, bikeId, startStationId, startTime } = input;

    type TxEither = import("effect").Either.Either<RentalRow, RentalServiceFailure>;

    const txEither = yield* Effect.tryPromise<TxEither, unknown>({
      try: () =>
        client.$transaction(async (tx) => {
          const eff: Effect.Effect<RentalRow, RentalServiceFailure, never> = Effect.gen(function* () {
            const existingByUser = yield* rentalRepo.findActiveByUserIdInTx(tx, userId).pipe(
              Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
            );
            if (Option.isSome(existingByUser)) {
              return yield* Effect.fail(new ActiveRentalExists({ userId }));
            }

            const existingByBike = yield* rentalRepo.findActiveByBikeIdInTx(tx, bikeId).pipe(
              Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
            );
            if (Option.isSome(existingByBike)) {
              return yield* Effect.fail(new BikeAlreadyRented({ bikeId }));
            }

            const bikeOpt = yield* bikeRepo.getByIdInTx(tx, bikeId).pipe(
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

            // TODO: Check subscription eligibility / usage rules (depends on subscriptions "useOne")
            // TODO: Reservation integration (if started from reservation):
            // - ensure reservation belongs to user and is active
            // - mark reservation consumed/expired appropriately
            // - apply reservation prepaid deduction to end-rental pricing

            const rental = yield* rentalRepo.createRentalInTx(tx, {
              userId,
              bikeId,
              startStationId,
              startTime,
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

            const updatedBike = yield* bikeRepo.updateStatusInTx(tx, bikeId, "BOOKED", startTime).pipe(
              Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
            );
            if (Option.isNone(updatedBike)) {
              return yield* Effect.fail(new BikeNotFound({ bikeId }));
            }

            return rental;
          });

          return Effect.runPromise(eff.pipe(Effect.either)) as Promise<TxEither>;
        }),
      catch: err => err as unknown,
    }).pipe(
      Effect.catchAll(err => Effect.die(err)),
    );

    return yield* Match.value(txEither).pipe(
      Match.tag("Right", ({ right }) => Effect.succeed(right)),
      Match.tag("Left", ({ left }) => Effect.fail(left)),
      Match.exhaustive,
    );
  });
}

export function endRentalUseCase(
  input: EndRentalInput,
): Effect.Effect<RentalRow, RentalServiceFailure, RentalRepository> {
  return Effect.gen(function* () {
    const repo = yield* RentalRepository;
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

    const durationMinutes = Math.max(
      1,
      Math.floor(
        (endTime.getTime() - new Date(current.startTime).getTime()) / 60000,
      ),
    );

    // TODO: Implement pricing logic (legacy behaviors depend on multiple domains):
    // - Subscription pricing / extra-hour charging (subscriptions.useOne + package rules)
    // - Reservation prepaid deduction (reservation domain)
    // - Penalty rules (duration thresholds)
    // - SOS/unsolvable exemptions (SOS domain)
    const totalPrice = null; // Will be calculated later

    return yield* repo.updateRentalOnEnd({
      rentalId,
      endStationId,
      endTime,
      durationMinutes,
      totalPrice,
      newStatus: "COMPLETED",
    }).pipe(
      Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
    );
  });
}
