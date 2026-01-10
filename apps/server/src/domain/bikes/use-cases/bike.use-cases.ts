import { Effect, Option } from "effect";

import type { PageRequest } from "@/domain/shared/pagination";
import type { BikeStatus } from "generated/prisma/enums";

import { Prisma } from "@/infrastructure/prisma";

import type {
  BikeFilter,
  BikeRow,
  BikeSortField,
} from "../models";

import {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
} from "../domain-errors";
import { BikeRepository } from "../repository/bike.repository";
import { BikeServiceTag } from "../services/bike.service";

export type CreateBikeInput = {
  chipId: string;
  stationId: string;
  supplierId: string;
  status?: BikeStatus;
};

export function createBikeUseCase(input: CreateBikeInput) {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.createBike(input);
  });
}

export type ListBikesInput = {
  filter: BikeFilter;
  pageReq: PageRequest<BikeSortField>;
};

export function listBikesUseCase(input: ListBikesInput) {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.listBikes(input.filter, input.pageReq);
  });
}

export function getBikeDetailUseCase(bikeId: string) {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.getBikeDetail(bikeId);
  });
}

export function reportBrokenBikeUseCase(bikeId: string) {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.reportBrokenBike(bikeId);
  });
}

export function adminUpdateBikeUseCase(bikeId: string, patch: Partial<{
  chipId: string;
  stationId: string;
  status: BikeStatus;
  supplierId: string | null;
}>): Effect.Effect<
  Option.Option<BikeRow>,
  BikeCurrentlyRented | BikeCurrentlyReserved | BikeNotFound,
  BikeServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* BikeServiceTag;
    return yield* service.adminUpdateBike(bikeId, patch);
  });
}

export function softDeleteBikeUseCase(bikeId: string): Effect.Effect<
  Option.Option<BikeRow>,
  BikeCurrentlyRented | BikeCurrentlyReserved | BikeNotFound,
  BikeRepository | Prisma
> {
  return Effect.gen(function* () {
    const repo = yield* BikeRepository;
    const { client } = yield* Prisma;

    const current = yield* repo.getById(bikeId).pipe(
      Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
    );
    if (Option.isNone(current)) {
      return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
    }

    const activeRental = yield* Effect.tryPromise({
      try: () =>
        client.rental.findFirst({
          where: { bikeId, status: { in: ["RENTED", "RESERVED"] } },
          select: { id: true },
        }),
      catch: cause => cause,
    }).pipe(Effect.catchAll(cause => Effect.die(cause)));
    if (activeRental) {
      return yield* Effect.fail(new BikeCurrentlyRented({ bikeId, action: "delete" }));
    }

    const pendingReservation = yield* Effect.tryPromise({
      try: () =>
        client.reservation.findFirst({
          where: { bikeId, status: "PENDING" },
          select: { id: true },
        }),
      catch: cause => cause,
    }).pipe(Effect.catchAll(cause => Effect.die(cause)));
    if (pendingReservation) {
      return yield* Effect.fail(new BikeCurrentlyReserved({ bikeId, action: "delete" }));
    }

    return yield* repo.updateStatus(bikeId, "UNAVAILABLE").pipe(
      Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
    );
  });
}
