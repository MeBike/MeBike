import { Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { DuplicateChipId } from "../domain-errors";
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
  BikeStationNotFound,
  BikeSupplierNotFound,
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
  ) => Effect.Effect<
    BikeRow,
    DuplicateChipId | BikeStationNotFound | BikeSupplierNotFound
  >;

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
    | BikeCurrentlyRented
    | BikeCurrentlyReserved
    | BikeNotFound
    | DuplicateChipId
    | BikeStationNotFound
    | BikeSupplierNotFound
  >;
};

function makeBikeService(
  repo: BikeRepo,
  client: import("generated/prisma/client").PrismaClient,
): BikeService {
  return {
    createBike: input =>
      Effect.gen(function* () {
        const [station, supplier] = yield* Effect.all([
          Effect.promise(() =>
            client.station.findUnique({
              where: { id: input.stationId },
              select: { id: true },
            })),
          Effect.promise(() =>
            client.supplier.findUnique({
              where: { id: input.supplierId },
              select: { id: true },
            })),
        ]);

        if (!station) {
          return yield* Effect.fail(new BikeStationNotFound({ stationId: input.stationId }));
        }
        if (!supplier) {
          return yield* Effect.fail(new BikeSupplierNotFound({ supplierId: input.supplierId }));
        }

        return yield* repo.create({
          chipId: input.chipId,
          stationId: input.stationId,
          supplierId: input.supplierId,
          status: input.status ?? "AVAILABLE",
        });
      }),

    listBikes: (filter, pageReq) =>
      repo.listByStationWithOffset(filter.stationId, filter, pageReq),

    getBikeDetail: (bikeId: string) =>
      repo.getById(bikeId),

    reportBrokenBike: (bikeId: string) =>
      repo.updateStatus(bikeId, "BROKEN"),

    adminUpdateBike: (bikeId, patch) =>
      Effect.gen(function* () {
        const current = yield* repo.getById(bikeId);
        if (Option.isNone(current)) {
          return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
        }

        if (patch.stationId && patch.stationId !== current.value.stationId) {
          const activeRental = yield* Effect.promise(() =>
            client.rental.findFirst({
              where: { bikeId, status: "RENTED" },
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

          const station = yield* Effect.promise(() =>
            client.station.findUnique({
              where: { id: patch.stationId },
              select: { id: true },
            }));
          if (!station) {
            return yield* Effect.fail(new BikeStationNotFound({ stationId: patch.stationId }));
          }
        }

        if (typeof patch.supplierId === "string" && patch.supplierId !== current.value.supplierId) {
          const supplierId = patch.supplierId;
          const supplier = yield* Effect.promise(() =>
            client.supplier.findUnique({
              where: { id: supplierId },
              select: { id: true },
            }));
          if (!supplier) {
            return yield* Effect.fail(new BikeSupplierNotFound({ supplierId }));
          }
        }

        const updated = yield* repo.updateById(bikeId, patch);
        if (Option.isNone(updated)) {
          return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
        }

        return updated;
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
