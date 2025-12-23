import { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { env } from "@/config/env";
import { BikeServiceTag } from "@/domain/bikes";
import { WalletServiceTag } from "@/domain/wallets";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalRow, RentalSortField, RentalStatusCounts } from "../models";
import type {
  EndRentalInput,
  ListMyRentalsInput,
  StartRentalInput,
} from "../types";

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
import { RentalRepository } from "../repository/rental.repository";
import { RentalServiceTag } from "../services/rental.service";

export function listMyRentalsUseCase(
  input: ListMyRentalsInput,
): Effect.Effect<PageResult<RentalRow>, never, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.listMyRentals(input.userId, input.filter, input.pageReq);
  });
}

export function listMyCurrentRentalsUseCase(
  userId: string,
  pageReq: PageRequest<RentalSortField>,
): Effect.Effect<PageResult<RentalRow>, never, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.listMyCurrentRentals(userId, pageReq);
  });
}

export function getMyRentalUseCase(
  userId: string,
  rentalId: string,
): Effect.Effect<Option.Option<RentalRow>, never, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.getMyRentalById(userId, rentalId);
  });
}

export function getMyRentalCountsUseCase(
  userId: string,
): Effect.Effect<RentalStatusCounts, never, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.getMyRentalCounts(userId);
  });
}

export function startRentalUseCase(
  input: StartRentalInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  RentalRepository | BikeServiceTag | WalletServiceTag
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

    return yield* repo.createRental({
      userId,
      bikeId,
      startStationId,
      startTime,
    }).pipe(
      Effect.catchTag("RentalUniqueViolation", () =>
        Effect.fail(new BikeAlreadyRented({ bikeId }))),
      Effect.catchTag("RentalRepositoryError", error =>
        Effect.die(error)),
    );
  });
}

export function endRentalUseCase(
  input: EndRentalInput,
): Effect.Effect<RentalRow, RentalServiceFailure, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.endRental(input);
  });
}
