import { Effect, Layer, Option } from "effect";

import type { BikeRepo } from "@/domain/bikes/repository/bike.repository";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type {
  StationRepo,
} from "@/domain/stations";

import { BikeRepository } from "@/domain/bikes";
import { BikeRepositoryError } from "@/domain/bikes/domain-errors";
import { RentalRepositoryError } from "@/domain/rentals/domain-errors";
import { defectOn } from "@/domain/shared";
import {
  StationNotFound,
  StationRepository,
} from "@/domain/stations";
import { StationRepositoryError } from "@/domain/stations/errors";

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
          defectOn(RentalRepositoryError),
        );
    },

    listMyCurrentRentals(userId, pageReq) {
      return repo
        .listMyCurrentRentals(userId, pageReq)
        .pipe(
          defectOn(RentalRepositoryError),
        );
    },

    getMyRentalById(userId, rentalId) {
      return repo
        .getMyRentalById(userId, rentalId)
        .pipe(
          defectOn(RentalRepositoryError),
        );
    },

    getMyRentalCounts(userId) {
      return repo.getMyRentalCounts(userId).pipe(
        defectOn(RentalRepositoryError),
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
              Effect.fail(new BikeAlreadyRented({ bikeId }))),
            defectOn(RentalRepositoryError),
          );

        yield* bikeRepo.updateStatus(bikeId, "BOOKED").pipe(
          defectOn(BikeRepositoryError),
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
            defectOn(RentalRepositoryError),
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
            defectOn(StationRepositoryError),
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
            defectOn(RentalRepositoryError),
          );
      }),

    staffListBikeSwapRequests(filter, pageReq) {
      return repo
        .staffListBikeSwapRequests(filter, pageReq)
        .pipe(
          defectOn(RentalRepositoryError),
        );
    },
  };

  return service;
}

export const RentalServiceLive = Layer.effect(
  RentalServiceTag,
  makeRentalServiceEffect.pipe(Effect.map(RentalServiceTag.make)),
);
