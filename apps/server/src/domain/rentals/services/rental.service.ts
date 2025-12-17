import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { RentalStatus } from "generated/prisma/enums";

import type {
  RentalServiceFailure,
} from "../domain-errors";
import type {
  MyRentalFilter,
  RentalRow,
  RentalSortField,
  RentalStatusCounts,
} from "../models";
import type { RentalRepo } from "../repository/rental.repository";

import {
  ActiveRentalExists,
  BikeAlreadyRented,
  EndStationMismatch,
  InvalidRentalState,
  RentalNotFound,
  UnauthorizedRentalAccess,
} from "../domain-errors";
import { RentalRepository } from "../repository/rental.repository";

export type RentalService = {
  // User-facing methods - can fail with repo errors
  listMyRentals: (
    userId: string,
    filter: MyRentalFilter,
    page: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<RentalRow>, never>;

  listMyCurrentRentals: (
    userId: string,
    page: PageRequest<RentalSortField>,
  ) => Effect.Effect<PageResult<RentalRow>, never>;

  getMyRentalById: (
    userId: string,
    rentalId: string,
  ) => Effect.Effect<Option.Option<RentalRow>, never>;

  getMyRentalCounts: (
    userId: string,
  ) => Effect.Effect<RentalStatusCounts, never>;

  // Core behaviors - fail with domain errors
  startRental: (args: {
    userId: string;
    bikeId: string;
    startStationId: string;
    startTime: Date;
  }) => Effect.Effect<RentalRow, RentalServiceFailure>;

  endRental: (args: {
    userId: string;
    rentalId: string;
    endStationId: string;
    endTime: Date;
  }) => Effect.Effect<RentalRow, RentalServiceFailure>;

  getByIdForUser: (
    args: { rentalId: string; userId: string },
  ) => Effect.Effect<RentalRow, RentalNotFound | UnauthorizedRentalAccess>;
};

export class RentalServiceTag extends Context.Tag("RentalService")<
  RentalServiceTag,
  RentalService
>() {}

function makeRentalService(repo: RentalRepo): RentalService {
  return {
    listMyRentals(userId, filter, pageReq) {
      return repo.listMyRentals(userId, filter, pageReq).pipe(
        Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
      );
    },

    listMyCurrentRentals(userId, pageReq) {
      return repo.listMyCurrentRentals(userId, pageReq).pipe(
        Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
      );
    },

    getMyRentalById(userId, rentalId) {
      return repo.getMyRentalById(userId, rentalId).pipe(
        Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
      );
    },

    getMyRentalCounts(userId) {
      return repo.getMyRentalCounts(userId).pipe(
        Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
        Effect.map((rows) => {
          const counts: RentalStatusCounts = {
            RENTED: 0,
            COMPLETED: 0,
            CANCELLED: 0,
            RESERVED: 0,
          };

          for (const row of rows) {
            counts[row.status] = row.count;
          }

          return counts;
        }),
      );
    },

    startRental({ userId, bikeId, startStationId, startTime }) {
      return Effect.gen(function* () {
        // 1. Enforce "one active rental per user"
        const existingByUser = yield* repo.findActiveByUserId(userId).pipe(
          Effect.catchTag("RentalRepositoryError", error =>
            Effect.die(error)),
        );
        if (Option.isSome(existingByUser)) {
          return yield* Effect.fail(
            new ActiveRentalExists({ userId }),
          );
        }

        // 2. Enforce "one active rental per bike"
        const existingByBike = yield* repo.findActiveByBikeId(bikeId).pipe(
          Effect.catchTag("RentalRepositoryError", error =>
            Effect.die(error)),
        );
        if (Option.isSome(existingByBike)) {
          return yield* Effect.fail(
            new BikeAlreadyRented({ bikeId }),
          );
        }

        // 3. TODO: Check bike availability/status via bike service (stubbed for now)
        // TODO: Check wallet balance (stubbed for now)

        // 4. Create rental
        const rental = yield* repo.createRental({
          userId,
          bikeId,
          startStationId,
          startTime,
        }).pipe(
          Effect.catchTag("RentalUniqueViolation", () =>
            Effect.fail(new BikeAlreadyRented({ bikeId }))),
          Effect.catchTag("RentalRepositoryError", error =>
            Effect.die(error)), // hopeless
        );

        return rental;
      });
    },

    endRental({ userId, rentalId, endStationId, endTime }) {
      return Effect.gen(function* () {
        // 1. Get rental
        const currentOpt = yield* repo.getMyRentalById(userId, rentalId).pipe(
          Effect.catchTag("RentalRepositoryError", error =>
            Effect.die(error)),
        );

        if (Option.isNone(currentOpt)) {
          return yield* Effect.fail(
            new RentalNotFound({ rentalId, userId }),
          );
        }

        const current = currentOpt.value;

        // 2. Validate state transition
        if (current.status !== "RENTED") {
          return yield* Effect.fail(
            new InvalidRentalState({
              rentalId,
              from: current.status,
              to: "COMPLETED" as RentalStatus,
            }),
          );
        }

        // 3. Validate end station matches start station (domain rule)
        if (current.startStationId !== endStationId) {
          return yield* Effect.fail(
            new EndStationMismatch({
              rentalId,
              startStationId: current.startStationId ?? null,
              attemptedEndStationId: endStationId,
            }),
          );
        }

        // 3. Calculate duration
        const durationMinutes = Math.max(
          1,
          Math.floor(
            (endTime.getTime() - new Date(current.startTime).getTime()) / 60000,
          ),
        );

        // 4. TODO: Implement pricing logic (placeholder)
        const totalPrice = null; // Will be calculated later

        // 5. Update rental
        const updated = yield* repo.updateRentalOnEnd({
          rentalId,
          endStationId,
          endTime,
          durationMinutes,
          totalPrice,
          newStatus: "COMPLETED",
        }).pipe(
          Effect.catchTag("RentalRepositoryError", error =>
            Effect.die(error)),
        );

        return updated;
      });
    },

    getByIdForUser: ({ rentalId, userId }) =>
      Effect.gen(function* () {
        const rentalOpt = yield* repo.getMyRentalById(userId, rentalId).pipe(
          Effect.catchTag("RentalRepositoryError", error => Effect.die(error)),
        );

        if (Option.isNone(rentalOpt)) {
          return yield* Effect.fail(new RentalNotFound({ rentalId, userId }));
        }

        const rental = rentalOpt.value;
        if (rental.userId !== userId) {
          return yield* Effect.fail(new UnauthorizedRentalAccess({ rentalId, userId }));
        }

        return rental;
      }),
  };
}

export const RentalServiceLive = Layer.effect(
  RentalServiceTag,
  Effect.gen(function* () {
    const repo = yield* RentalRepository;
    return makeRentalService(repo);
  }),
);
