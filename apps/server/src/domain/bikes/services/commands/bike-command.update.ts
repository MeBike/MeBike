import { Effect, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { makeStationQueryRepository } from "@/domain/stations/repository/station-query.repository";

import type { AdminBikeUpdatePatch } from "./bike-command.service.types";

import {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
  BikeRepositoryError,
  BikeStationNotFound,
  BikeStationPlacementCapacityExceeded,
  BikeSupplierNotFound,
  InvalidBikeStatus,
} from "../../domain-errors";
import { makeBikeRepository } from "../../repository/bike.repository";
import {
  getAdminAllowedStatusTransitions,
  getAvailablePlacementSlots,
  isBikeUpdateDomainPassThroughError,
  lockStationRow,
} from "./bike-command.helpers";

export function adminUpdateBikeWithGuards(
  client: PrismaClient,
  bikeId: string,
  patch: AdminBikeUpdatePatch,
) {
  return Effect.tryPromise({
    try: () => client.$transaction(async (tx) => {
      const txBikeRepo = makeBikeRepository(tx);
      const txStationRepo = makeStationQueryRepository(tx);

      const current = await Effect.runPromise(txBikeRepo.getById(bikeId));
      if (Option.isNone(current)) {
        throw new BikeNotFound({ id: bikeId });
      }

      if (patch.status && patch.status !== current.value.status) {
        const allowed = getAdminAllowedStatusTransitions(current.value.status);
        if (!allowed.includes(patch.status)) {
          throw new InvalidBikeStatus({
            status: patch.status,
            allowed,
          });
        }
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
  });
}
