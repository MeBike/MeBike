import { Effect, Option } from "effect";

import type { RentalStatus } from "generated/prisma/enums";

import { env } from "@/config/env";
import { BikeServiceTag } from "@/domain/bikes";
import { WalletServiceTag } from "@/domain/wallets";

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
import { RentalServiceTag } from "../services/rental.service";

export function startRentalUseCase(
  input: StartRentalInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  RentalRepository | RentalServiceTag | BikeServiceTag | WalletServiceTag
> {
  return Effect.gen(function* () {
    // TODO(architecture): This use-case currently calls `RentalRepository` directly for active-rental checks + creation.
    // Move this orchestration into `RentalService` (or a dedicated RentalWorkflow service) and expose it via `RentalServiceTag`,
    // so use-cases depend on domain services instead of persistence adapters.
    // TODO(race): This flow does "read wallet balance -> create rental" without an atomic transaction/lock.
    // Two concurrent start-rental requests can both pass the balance check (double-spending / double-rent).
    // Fix by performing an atomic debit + rental creation inside a single DB transaction (wallet row lock / compare-and-update),
    // and treat wallet debit as the gate.
    const repo = yield* RentalRepository;
    const bikeService = yield* BikeServiceTag;
    const walletService = yield* WalletServiceTag;
    const rentalService = yield* RentalServiceTag;
    const { userId, bikeId, startStationId, startTime } = input;

    const existingByUser = yield* repo.findActiveByUserId(userId).pipe(
      Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
    );
    if (Option.isSome(existingByUser)) {
      return yield* Effect.fail(new ActiveRentalExists({ userId }));
    }

    const existingByBike = yield* repo.findActiveByBikeId(bikeId).pipe(
      Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
    );
    if (Option.isSome(existingByBike)) {
      return yield* Effect.fail(new BikeAlreadyRented({ bikeId }));
    }

    const bikeOpt = yield* bikeService.getBikeDetail(bikeId);
    if (Option.isNone(bikeOpt)) {
      return yield* Effect.fail(new BikeNotFound({ bikeId }));
    }
    const bike = bikeOpt.value;

    if (!bike.stationId) {
      return yield* Effect.fail(new BikeMissingStation({ bikeId }));
    }
    if (bike.stationId !== startStationId) {
      return yield* Effect.fail(new BikeNotFoundInStation({
        bikeId,
        stationId: startStationId,
      }));
    }

    const bikeStatusFailure = startRentalFailureFromBikeStatus({
      bikeId,
      status: bike.status,
    });
    if (Option.isSome(bikeStatusFailure)) {
      return yield* Effect.fail(bikeStatusFailure.value);
    }

    const wallet = yield* walletService.getByUserId(userId).pipe(
      Effect.catchTag("WalletNotFound", () =>
        Effect.fail(new UserWalletNotFound({ userId }))),
      Effect.catchTag("WalletRepositoryError", err => Effect.die(err)),
    );
    const currentBalance = Number(wallet.balance.toString());
    const requiredBalance = env.MIN_WALLET_BALANCE_TO_RENT;
    if (Number.isNaN(currentBalance)) {
      return yield* Effect.fail(new InsufficientBalanceToRent({
        userId,
        requiredBalance,
        currentBalance: 0,
      }));
    }
    if (currentBalance < requiredBalance) {
      return yield* Effect.fail(new InsufficientBalanceToRent({
        userId,
        requiredBalance,
        currentBalance,
      }));
    }

    // TODO: Check subscription eligibility / usage rules (depends on subscriptions "useOne")
    // TODO: Reservation integration (if started from reservation):
    // - ensure reservation belongs to user and is active
    // - mark reservation consumed/expired appropriately
    // - apply reservation prepaid deduction to end-rental pricing

    return yield* rentalService.createRentalSession({
      userId,
      bikeId,
      startStationId,
      startTime,
    });
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
