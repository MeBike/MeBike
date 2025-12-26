import { Effect, Option } from "effect";

import type { BikeRepo } from "@/domain/bikes/repository/bike.repository";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { BikeRepository, BikeRepositoryLive } from "@/domain/bikes";

import type { RentalServiceFailure } from "../domain-errors";
import type {
  MyRentalFilter,
  RentalRow,
  RentalSortField,
  RentalStatusCounts,
} from "../models";
import type { RentalRepo } from "../repository/rental.repository";

import {
  BikeAlreadyRented,
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

  createRentalSession: (args: {
    userId: string;
    bikeId: string;
    startStationId: string;
    startTime: Date;
  }) => Effect.Effect<RentalRow, RentalServiceFailure>;

  getByIdForUser: (
    args: { rentalId: string; userId: string },
  ) => Effect.Effect<RentalRow, RentalNotFound | UnauthorizedRentalAccess>;
};

export class RentalServiceTag extends Effect.Service<RentalServiceTag>()(
  "RentalService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* RentalRepository;
      const bikeRepo = yield* BikeRepository;
      return makeRentalService(repo, bikeRepo);
    }),
    dependencies: [RentalRepository.Default, BikeRepositoryLive],
  },
) {}

function makeRentalService(
  repo: RentalRepo,
  bikeRepo: BikeRepo,
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

    createRentalSession({ userId, bikeId, startStationId, startTime }) {
      return Effect.gen(function* () {
        const created = yield* repo.createRental({
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

        yield* bikeRepo.updateStatus(bikeId, "BOOKED").pipe(
          Effect.catchTag("BikeRepositoryError", error => Effect.die(error)),
          Effect.ignore,
        );

        return created;
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

export const RentalServiceLive = RentalServiceTag.Default;
