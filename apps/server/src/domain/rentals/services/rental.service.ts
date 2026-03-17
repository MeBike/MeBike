import { Effect, Layer, Option } from "effect";

import type { BikeRepo } from "@/domain/bikes/repository/bike.repository";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { BikeRepository } from "@/domain/bikes";

import type { RentalServiceFailure } from "../domain-errors";
import type {
  BikeSwapRequestRow,
  MyRentalFilter,
  RentalRow,
  RentalSortField,
  RentalStatusCounts,
  StaffBikeSwapRequestFilter,
  StaffBikeSwapRequestRow,
  StaffBikeSwapRequestSortField,
} from "../models";
import type { RentalRepo } from "../repository/rental.repository";

import {
  BikeAlreadyRented,
  CannotRequestSwap,
  RentalNotFound,
  UnauthorizedRentalAccess,
} from "../domain-errors";
import { RentalRepository } from "../repository/rental.repository";
import { aggregateRentalStatusCounts } from "./rental-counts";
import {
  StationNotFound,
  StationRepo,
  StationRepository,
} from "@/domain/stations";

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

  getByIdForUser: (args: {
    rentalId: string;
    userId: string;
  }) => Effect.Effect<RentalRow, RentalNotFound | UnauthorizedRentalAccess>;

  requestBikeSwap: (args: {
    rentalId: string;
    userId: string;
    stationId: string;
  }) => Effect.Effect<
    BikeSwapRequestRow,
    RentalServiceFailure | UnauthorizedRentalAccess | StationNotFound
  >;

  staffListBikeSwapRequests: (
    filter: StaffBikeSwapRequestFilter,
    page: PageRequest<StaffBikeSwapRequestSortField>,
  ) => Effect.Effect<PageResult<StaffBikeSwapRequestRow>, never>;
};

const makeRentalServiceEffect = Effect.gen(function* () {
  const repo = yield* RentalRepository;
  const bikeRepo = yield* BikeRepository;
  const stationRepo = yield* StationRepository;
  return makeRentalService(repo, bikeRepo, stationRepo);
});

export class RentalServiceTag extends Effect.Service<RentalServiceTag>()(
  "RentalService",
  {
    effect: makeRentalServiceEffect,
  },
) {}

function makeRentalService(
  repo: RentalRepo,
  bikeRepo: BikeRepo,
  stationRepo: StationRepo,
): RentalService {
  const service: RentalService = {
    listMyRentals(userId, filter, pageReq) {
      return repo
        .listMyRentals(userId, filter, pageReq)
        .pipe(
          Effect.catchTag("RentalRepositoryError", (error) =>
            Effect.die(error),
          ),
        );
    },

    listMyCurrentRentals(userId, pageReq) {
      return repo
        .listMyCurrentRentals(userId, pageReq)
        .pipe(
          Effect.catchTag("RentalRepositoryError", (error) =>
            Effect.die(error),
          ),
        );
    },

    getMyRentalById(userId, rentalId) {
      return repo
        .getMyRentalById(userId, rentalId)
        .pipe(
          Effect.catchTag("RentalRepositoryError", (error) =>
            Effect.die(error),
          ),
        );
    },

    getMyRentalCounts(userId) {
      return repo.getMyRentalCounts(userId).pipe(
        Effect.catchTag("RentalRepositoryError", (error) => Effect.die(error)),
        Effect.map(aggregateRentalStatusCounts),
      );
    },

    createRentalSession({ userId, bikeId, startStationId, startTime }) {
      return Effect.gen(function* () {
        const created = yield* repo
          .createRental({
            userId,
            bikeId,
            startStationId,
            startTime,
          })
          .pipe(
            Effect.catchTag("RentalUniqueViolation", () =>
              Effect.fail(new BikeAlreadyRented({ bikeId })),
            ),
            Effect.catchTag("RentalRepositoryError", (error) =>
              Effect.die(error),
            ),
          );

        yield* bikeRepo.updateStatus(bikeId, "BOOKED").pipe(
          Effect.catchTag("BikeRepositoryError", (error) => Effect.die(error)),
          Effect.ignore,
        );

        return created;
      });
    },

    getByIdForUser: ({ rentalId, userId }) =>
      Effect.gen(function* () {
        const rentalOpt = yield* repo
          .getMyRentalById(userId, rentalId)
          .pipe(
            Effect.catchTag("RentalRepositoryError", (error) =>
              Effect.die(error),
            ),
          );

        if (Option.isNone(rentalOpt)) {
          return yield* Effect.fail(new RentalNotFound({ rentalId, userId }));
        }

        const rental = rentalOpt.value;
        if (rental.userId !== userId) {
          return yield* Effect.fail(
            new UnauthorizedRentalAccess({ rentalId, userId }),
          );
        }

        return rental;
      }),

    requestBikeSwap: ({ rentalId, userId, stationId }) =>
      Effect.gen(function* () {
        const station = yield* stationRepo
          .getById(stationId)
          .pipe(
            Effect.catchTag("StationRepositoryError", (error) =>
              Effect.die(error),
            ),
          );
        if (!station) {
          return yield* Effect.fail(new StationNotFound({ id: stationId }));
        }

        const rental = yield* service.getByIdForUser({ rentalId, userId });

        if (rental.userId !== userId) {
          return yield* Effect.fail(
            new UnauthorizedRentalAccess({ rentalId, userId }),
          );
        }

        if (rental.status !== "RENTED") {
          return yield* Effect.fail(
            new CannotRequestSwap({ rentalId, status: rental.status }),
          );
        }

        return yield* repo
          .requestBikeSwap(rentalId, userId, rental.bikeId!, stationId)
          .pipe(
            Effect.catchTag("RentalRepositoryError", (error) =>
              Effect.die(error),
            ),
          );
      }),

    staffListBikeSwapRequests(filter, pageReq) {
      return repo
        .staffListBikeSwapRequests(filter, pageReq)
        .pipe(
          Effect.catchTag("RentalRepositoryError", (error) =>
            Effect.die(error),
          ),
        );
    },
  };

  return service;
}

export const RentalServiceLive = Layer.effect(
  RentalServiceTag,
  makeRentalServiceEffect.pipe(Effect.map(RentalServiceTag.make)),
);
