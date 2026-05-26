import { Effect, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { makeStationQueryRepository } from "@/domain/stations/repository/station-query.repository";

import type { AdminBikeUpdatePatch } from "./bike-command.service.types";

import {
  BikeCurrentlyIncidentReported,
  BikeCurrentlyRedistributing,
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
  BikeRepositoryError,
  BikeStationNotFound,
  BikeStationPlacementCapacityExceeded,
  BikeSupplierNotActive,
  BikeSupplierNotFound,
  InvalidBikeStatus,
} from "../../domain-errors";
import { makeBikeRepository } from "../../repository/bike.repository";
import {
  getAdminAllowedStatusTransitions,
  getAvailablePlacementSlots,
  isBikeUpdateDomainPassThroughError,
  lockBikeRow,
  lockStationRow,
  validateSystemCapacity,
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

      await lockBikeRow(tx, bikeId);

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

        const isCurrentActive = !["LOST", "DISABLED"].includes(current.value.status);
        const isTargetActive = !["LOST", "DISABLED"].includes(patch.status);
        if (!isCurrentActive && isTargetActive) {
          await validateSystemCapacity(tx);
        }
      }

      if (patch.stationId && patch.stationId !== current.value.stationId) {
        // Đổi station chỉ hợp lệ khi không phá vỡ flow thuê/đặt chỗ đang hoạt động,
        // đồng thời vẫn phải tôn trọng sức chứa của station đích trong cùng tx.
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

        const redistributionBike = await tx.bike.findFirst({
          where: { id: bikeId, status: { in: ["PENDING_DISPATCH", "TRANSPORTING"] } },
          select: { id: true },
        });
        if (redistributionBike) {
          throw new BikeCurrentlyRedistributing({ bikeId, action: "update_station" });
        }

        const incidentBike = await tx.bike.findFirst({
          where: { id: bikeId, status: "SWAPPING" },
          select: { id: true },
        });
        if (incidentBike) {
          throw new BikeCurrentlyIncidentReported({ bikeId, action: "update_station" });
        }

        await lockStationRow(tx, patch.stationId);

        const stationOpt = await Effect.runPromise(txStationRepo.getById(patch.stationId));
        if (Option.isNone(stationOpt)) {
          throw new BikeStationNotFound({ stationId: patch.stationId });
        }

        const station = stationOpt.value;
        // Kiểm tra sức chứa sau khi đã khóa station đích để quyết định dùng chung
        // một ảnh chụp tuần tự của occupancy, tránh race khi nhiều mutation cùng lúc.
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
          select: { id: true, status: true },
        });
        if (!supplier) {
          throw new BikeSupplierNotFound({ supplierId: patch.supplierId });
        }
        if (supplier.status !== "ACTIVE") {
          throw new BikeSupplierNotActive({
            supplierId: supplier.id,
            status: supplier.status,
          });
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
