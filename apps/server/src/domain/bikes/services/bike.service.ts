import { Effect, Layer, Option } from "effect";

import type { BikeStatus } from "generated/prisma/client";

import { makeStationQueryRepository } from "@/domain/stations/repository/station-query.repository";
import { Prisma } from "@/infrastructure/prisma";

import type { BikeRepo } from "../repository/bike.repository";
import type { BikeManageableStatus, BikeService } from "./bike.service.types";

import {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
  BikeRepositoryError,
  BikeStationNotFound,
  BikeStationPlacementCapacityExceeded,
  BikeSupplierNotFound,
  InvalidBikeStatus,
} from "../domain-errors";
import { BikeRepository, makeBikeRepository } from "../repository/bike.repository";

function getScopedStatusTransitions(currentStatus: BikeStatus): readonly BikeManageableStatus[] {
  if (currentStatus === "AVAILABLE") {
    return ["BROKEN"] as const;
  }

  if (currentStatus === "BROKEN") {
    return ["AVAILABLE"] as const;
  }

  return [] as const;
}

function isBikeCreateDomainPassThroughError(
  cause: unknown,
): cause is
| BikeStationNotFound
| BikeStationPlacementCapacityExceeded
| BikeSupplierNotFound {
  return cause instanceof BikeStationNotFound
    || cause instanceof BikeStationPlacementCapacityExceeded
    || cause instanceof BikeSupplierNotFound;
}

function isBikeUpdateDomainPassThroughError(
  cause: unknown,
): cause is
| BikeCurrentlyRented
| BikeCurrentlyReserved
| BikeNotFound
| BikeStationNotFound
| BikeStationPlacementCapacityExceeded
| BikeSupplierNotFound {
  return cause instanceof BikeCurrentlyRented
    || cause instanceof BikeCurrentlyReserved
    || cause instanceof BikeNotFound
    || cause instanceof BikeStationNotFound
    || cause instanceof BikeStationPlacementCapacityExceeded
    || cause instanceof BikeSupplierNotFound;
}

function getAvailablePlacementSlots(station: {
  totalCapacity: number;
  totalBikes: number;
  activeReturnSlots: number;
}) {
  return Math.max(0, station.totalCapacity - station.totalBikes - station.activeReturnSlots);
}

async function lockStationRow(
  tx: import("generated/prisma/client").PrismaClient | import("generated/prisma/client").Prisma.TransactionClient,
  stationId: string,
) {
  await tx.$queryRaw`
    SELECT id
    FROM "Station"
    WHERE id = ${stationId}::uuid
    FOR UPDATE
  `;
}

function makeBikeService(
  repo: BikeRepo,
  client: import("generated/prisma/client").PrismaClient,
): BikeService {
  return {
    createBike: input =>
      Effect.tryPromise({
        try: () => client.$transaction(async (tx) => {
          const txBikeRepo = makeBikeRepository(tx);
          const txStationRepo = makeStationQueryRepository(tx);

          await lockStationRow(tx, input.stationId);

          const [stationOpt, supplier] = await Promise.all([
            Effect.runPromise(txStationRepo.getById(input.stationId)),
            tx.supplier.findUnique({
              where: { id: input.supplierId },
              select: { id: true },
            }),
          ]);

          if (Option.isNone(stationOpt)) {
            throw new BikeStationNotFound({ stationId: input.stationId });
          }

          if (!supplier) {
            throw new BikeSupplierNotFound({ supplierId: input.supplierId });
          }

          const station = stationOpt.value;
          const availablePlacementSlots = getAvailablePlacementSlots(station);
          if (availablePlacementSlots < 1) {
            throw new BikeStationPlacementCapacityExceeded({
              stationId: station.id,
              availablePlacementSlots,
              requiredPlacementSlots: 1,
            });
          }

          return await Effect.runPromise(txBikeRepo.create({
            stationId: input.stationId,
            supplierId: input.supplierId,
            status: input.status ?? "AVAILABLE",
          }));
        }),
        catch: cause =>
          isBikeCreateDomainPassThroughError(cause)
            ? cause
            : new BikeRepositoryError({
                operation: "create",
                cause,
                message: "Failed to create bike",
              }),
      }),

    listBikes: (filter, pageReq) =>
      repo.listByStationWithOffset(filter.stationId, filter, pageReq),

    getBikeDetail: (bikeId: string) =>
      repo.getById(bikeId),

    adminUpdateBike: (bikeId, patch) =>
      Effect.tryPromise({
        try: () => client.$transaction(async (tx) => {
          const txBikeRepo = makeBikeRepository(tx);
          const txStationRepo = makeStationQueryRepository(tx);

          const current = await Effect.runPromise(txBikeRepo.getById(bikeId));
          if (Option.isNone(current)) {
            throw new BikeNotFound({ id: bikeId });
          }

          if (patch.stationId && patch.stationId !== current.value.stationId) {
            const activeRental = await tx.rental.findFirst({
              where: { bikeId, status: "RENTED" },
              select: { id: true },
            });
            if (activeRental) {
              throw new BikeCurrentlyRented({ bikeId, action: "update_station" });
            }

            const pendingReservation = await tx.reservation.findFirst({
              where: { bikeId, status: "PENDING" },
              select: { id: true },
            });
            if (pendingReservation) {
              throw new BikeCurrentlyReserved({ bikeId, action: "update_station" });
            }

            await lockStationRow(tx, patch.stationId);

            const stationOpt = await Effect.runPromise(txStationRepo.getById(patch.stationId));
            if (Option.isNone(stationOpt)) {
              throw new BikeStationNotFound({ stationId: patch.stationId });
            }

            const station = stationOpt.value;
            const availablePlacementSlots = getAvailablePlacementSlots(station);
            if (availablePlacementSlots < 1) {
              throw new BikeStationPlacementCapacityExceeded({
                stationId: station.id,
                availablePlacementSlots,
                requiredPlacementSlots: 1,
              });
            }
          }

          if (typeof patch.supplierId === "string" && patch.supplierId !== current.value.supplierId) {
            const supplier = await tx.supplier.findUnique({
              where: { id: patch.supplierId },
              select: { id: true },
            });
            if (!supplier) {
              throw new BikeSupplierNotFound({ supplierId: patch.supplierId });
            }
          }

          const updated = await Effect.runPromise(txBikeRepo.updateById(bikeId, patch));
          if (Option.isNone(updated)) {
            throw new BikeNotFound({ id: bikeId });
          }

          return updated;
        }),
        catch: cause =>
          isBikeUpdateDomainPassThroughError(cause)
            ? cause
            : new BikeRepositoryError({
                operation: "adminUpdateBike",
                cause,
                message: "Failed to update bike",
              }),
      }),

    updateBikeStatusInStationScope: (bikeId, input) =>
      Effect.gen(function* () {
        const current = yield* repo.getById(bikeId);

        if (Option.isNone(current) || current.value.stationId !== input.stationId) {
          return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
        }

        const allowed = getScopedStatusTransitions(current.value.status);
        if (!allowed.includes(input.status)) {
          return yield* Effect.fail(new InvalidBikeStatus({
            status: input.status,
            allowed,
          }));
        }

        const updated = yield* repo.transitionStatusInStationAt(
          bikeId,
          input.stationId,
          current.value.status,
          input.status,
          new Date(),
        );

        if (Option.isSome(updated)) {
          return updated.value;
        }

        const latest = yield* repo.getById(bikeId);
        if (Option.isNone(latest) || latest.value.stationId !== input.stationId) {
          return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
        }

        return yield* Effect.fail(new InvalidBikeStatus({
          status: input.status,
          allowed: getScopedStatusTransitions(latest.value.status),
        }));
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
