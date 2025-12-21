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
  EndStationMismatch,
  InvalidRentalState,
  RentalNotFound,
  UnauthorizedRentalAccess,
} from "../domain-errors";
import { RentalRepository } from "../repository/rental.repository";

export type RentalService = {
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

function makeRentalService(
  repo: RentalRepo,
): RentalService {
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

        // 4. TODO: Implement pricing logic (legacy behaviors depend on multiple domains):
        //    - Subscription pricing / extra-hour charging (subscriptions.useOne + package rules)
        //    - Reservation prepaid deduction (reservation domain)
        //    - Penalty rules (duration thresholds)
        //    - SOS/unsolvable exemptions (SOS domain)
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
