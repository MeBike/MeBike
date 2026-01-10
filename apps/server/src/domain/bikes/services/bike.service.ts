import { Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type {
  BikeRepositoryError,
  DuplicateChipId,
} from "../domain-errors";
import type {
  BikeFilter,
  BikeRow,
  BikeSortField,
} from "../models";
import type { BikeRepo } from "../repository/bike.repository";

import {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
} from "../domain-errors";
import { BikeRepository } from "../repository/bike.repository";

export type BikeService = {
  createBike: (
    input: {
      chipId: string;
      stationId: string;
      supplierId: string;
      status?: BikeStatus;
    },
  ) => Effect.Effect<BikeRow, BikeRepositoryError | DuplicateChipId>;

  listBikes: (
    filter: BikeFilter,
    pageReq: PageRequest<BikeSortField>,
  ) => Effect.Effect<PageResult<BikeRow>>;

  getBikeDetail: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>>;

  reportBrokenBike: (
    bikeId: string,
  ) => Effect.Effect<Option.Option<BikeRow>>;

  adminUpdateBike: (
    bikeId: string,
    patch: Partial<{
      chipId: string;
      stationId: string;
      status: BikeStatus;
      supplierId: string | null;
    }>,
  ) => Effect.Effect<
    Option.Option<BikeRow>,
    BikeCurrentlyRented | BikeCurrentlyReserved | BikeNotFound
  >;
};

function makeBikeService(
  repo: BikeRepo,
  client: import("generated/prisma/client").PrismaClient,
): BikeService {
  return {
    createBike: input =>
      repo.create({
        chipId: input.chipId,
        stationId: input.stationId,
        supplierId: input.supplierId,
        status: input.status ?? "AVAILABLE",
      }),

    listBikes: (filter, pageReq) =>
      repo
        .listByStationWithOffset(filter.stationId, filter, pageReq)
        .pipe(
          Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
        ),

    getBikeDetail: (bikeId: string) =>
      repo.getById(bikeId).pipe(
        Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
      ),

    reportBrokenBike: (bikeId: string) =>
      repo.updateStatus(bikeId, "BROKEN").pipe(
        Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
      ),

    adminUpdateBike: (bikeId, patch) =>
      Effect.gen(function* () {
        const current = yield* repo
          .getById(bikeId)
          .pipe(
            Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
          );
        if (Option.isNone(current)) {
          return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
        }

        if (patch.stationId && patch.stationId !== current.value.stationId) {
          const activeRental = yield* Effect.promise(() =>
            client.rental.findFirst({
              where: { bikeId, status: { in: ["RENTED", "RESERVED"] } },
              select: { id: true },
            }),
          );
          if (activeRental) {
            return yield* Effect.fail(
              new BikeCurrentlyRented({ bikeId, action: "update_station" }),
            );
          }

          const pendingReservation = yield* Effect.promise(() =>
            client.reservation.findFirst({
              where: { bikeId, status: "PENDING" },
              select: { id: true },
            }),
          );
          if (pendingReservation) {
            return yield* Effect.fail(
              new BikeCurrentlyReserved({ bikeId, action: "update_station" }),
            );
          }
        }

        const updated = yield* Effect.promise(() =>
          client.bike.update({
            where: { id: bikeId },
            data: {
              ...(patch.chipId ? { chipId: patch.chipId } : {}),
              ...(patch.stationId ? { stationId: patch.stationId } : {}),
              ...(patch.status ? { status: patch.status } : {}),
              ...(patch.supplierId !== undefined
                ? { supplierId: patch.supplierId }
                : {}),
            },
            select: {
              id: true,
              chipId: true,
              stationId: true,
              supplierId: true,
              status: true,
            },
          }),
        );

        return Option.some(updated);
      }),

  };
}

const makeBikeServiceEffect = Effect.gen(function* () {
  const repo = yield* BikeRepository;
  const { client } = yield* Prisma;
  return makeBikeService(repo, client);
});

export class BikeServiceTag extends Effect.Service<BikeServiceTag>()(
  "BikeService",
  {
    effect: makeBikeServiceEffect,
  },
) {}

export const BikeServiceLive = Layer.effect(
  BikeServiceTag,
  makeBikeServiceEffect.pipe(Effect.map(BikeServiceTag.make)),
);
