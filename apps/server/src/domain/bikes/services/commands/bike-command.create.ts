import { Effect, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { makeStationQueryRepository } from "@/domain/stations/repository/station-query.repository";

import type { CreateBikeInput } from "./bike-command.service.types";

import {
  BikeRepositoryError,
  BikeStationNotFound,
  BikeStationPlacementCapacityExceeded,
  BikeSupplierNotActive,
  BikeSupplierNotFound,
} from "../../domain-errors";
import { makeBikeRepository } from "../../repository/bike.repository";
import {
  getAvailablePlacementSlots,
  isBikeCreateDomainPassThroughError,
  lockStationRow,
  validateSystemCapacity,
} from "./bike-command.helpers";

export function createBikeWithGuards(client: PrismaClient, input: CreateBikeInput) {
  return Effect.tryPromise({
    try: () => client.$transaction(async (tx) => {
      const txBikeRepo = makeBikeRepository(tx);
      const txStationRepo = makeStationQueryRepository(tx);

      // Khóa station trước khi kiểm tra sức chứa để tránh 2 admin create đồng thời
      // cùng nhìn thấy một lượng chỗ trống rồi ghi vượt sức chứa thực tế.
      await lockStationRow(tx, input.stationId);

      const [stationOpt, supplier] = await Promise.all([
        Effect.runPromise(txStationRepo.getById(input.stationId)),
        tx.supplier.findUnique({
          where: { id: input.supplierId },
          select: { id: true, status: true },
        }),
      ]);

      if (Option.isNone(stationOpt)) {
        throw new BikeStationNotFound({ stationId: input.stationId });
      }

      if (!supplier) {
        throw new BikeSupplierNotFound({ supplierId: input.supplierId });
      }
      if (supplier.status !== "ACTIVE") {
        throw new BikeSupplierNotActive({
          supplierId: supplier.id,
          status: supplier.status,
        });
      }

      const targetStatus = input.status ?? "AVAILABLE";
      if (!["LOST", "DISABLED"].includes(targetStatus)) {
        await validateSystemCapacity(tx);
      }

      const station = stationOpt.value;
      // Rule đặt thêm xe phải bám theo sức chứa đang bị chiếm thực tế của station,
      // không chỉ nhìn `totalCapacity` thô. Hết chỗ thì fail trước khi ghi.
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
        status: targetStatus,
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
  });
}
