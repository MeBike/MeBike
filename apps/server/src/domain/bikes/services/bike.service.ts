import { Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import { pickDefined } from "@/domain/shared/pick-defined";
import {
  isPrismaForeignKeyViolation,
  isPrismaRecordNotFound,
  isPrismaUniqueViolation,
} from "@/infrastructure/prisma-errors";
import type { BikeStatus } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type {
  BikeStationNotFound,
  BikeSupplierNotFound,
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
  BikeRepositoryError as BikeRepositoryErrorClass,
  DuplicateChipId as DuplicateChipIdError,
  BikeStationNotFound as BikeStationNotFoundError,
  BikeSupplierNotFound as BikeSupplierNotFoundError,
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
    BikeRepositoryError | DuplicateChipId | BikeStationNotFound | BikeSupplierNotFound
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
    | BikeRepositoryError
  >;
};

function makeBikeService(
  repo: BikeRepo,
  client: import("generated/prisma/client").PrismaClient,
): BikeService {
  return {
    createBike: input =>
      Effect.gen(function* () {
        const station = yield* Effect.promise(() =>
          client.station.findUnique({
            where: { id: input.stationId },
            select: { id: true },
          }));
        if (!station) {
          return yield* Effect.fail(new BikeStationNotFoundError({ stationId: input.stationId }));
        }

        const supplier = yield* Effect.promise(() =>
          client.supplier.findUnique({
            where: { id: input.supplierId },
            select: { id: true },
          }));
        if (!supplier) {
          return yield* Effect.fail(new BikeSupplierNotFoundError({ supplierId: input.supplierId }));
        }

        return yield* repo.create({
          chipId: input.chipId,
          stationId: input.stationId,
          supplierId: input.supplierId,
          status: input.status ?? "AVAILABLE",
        });
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

          const station = yield* Effect.promise(() =>
            client.station.findUnique({
              where: { id: patch.stationId },
              select: { id: true },
            }));
          if (!station) {
            return yield* Effect.fail(new BikeStationNotFoundError({ stationId: patch.stationId }));
          }
        }

        const nextSupplierId = patch.supplierId;
        if (nextSupplierId != null && nextSupplierId !== current.value.supplierId) {
          const supplier = yield* Effect.promise(() =>
            client.supplier.findUnique({
              where: { id: nextSupplierId },
              select: { id: true },
            }));
          if (!supplier) {
            return yield* Effect.fail(new BikeSupplierNotFoundError({ supplierId: nextSupplierId }));
          }
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.bike.update({
              where: { id: bikeId },
              data: pickDefined({
                chipId: patch.chipId,
                stationId: patch.stationId,
                status: patch.status,
                supplierId: patch.supplierId,
              }),
              select: {
                id: true,
                chipId: true,
                stationId: true,
                supplierId: true,
                status: true,
              },
            }),
          catch: (err: unknown) => {
            if (isPrismaUniqueViolation(err)) {
              return new DuplicateChipIdError({ chipId: patch.chipId ?? current.value.chipId });
            }
            if (isPrismaRecordNotFound(err)) {
              return new BikeNotFound({ id: bikeId });
            }
            if (isPrismaForeignKeyViolation(err)) {
              if (patch.stationId) {
                return new BikeStationNotFoundError({ stationId: patch.stationId });
              }
              if (patch.supplierId != null) {
                return new BikeSupplierNotFoundError({ supplierId: patch.supplierId });
              }
            }
            return new BikeRepositoryErrorClass({
              operation: "adminUpdateBike.update",
              cause: err,
              message: "Failed to update bike",
            });
          },
        });

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
