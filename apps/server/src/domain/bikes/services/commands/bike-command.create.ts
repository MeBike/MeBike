import { Effect, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { makeStationQueryRepository } from "@/domain/stations/repository/station-query.repository";

import type { CreateBikeInput } from "./bike-command.service.types";

import {
  BikeRepositoryError,
  BikeStationNotFound,
  BikeStationPlacementCapacityExceeded,
  BikeSupplierNotFound,
  BikeSystemCapacityExceeded,
} from "../../domain-errors";
import { makeBikeRepository } from "../../repository/bike.repository";
import {
  getAvailablePlacementSlots,
  isBikeCreateDomainPassThroughError,
  lockStationRow,
} from "./bike-command.helpers";
import { countInStationBikes } from "@/domain/stations/repository/station.repository.counts";

export function createBikeWithGuards(client: PrismaClient, input: CreateBikeInput) {
  return Effect.tryPromise({
    try: () => client.$transaction(async (tx) => {
      const txBikeRepo = makeBikeRepository(tx);
      const txStationRepo = makeStationQueryRepository(tx);

      // Khóa station trước khi kiểm tra sức chứa để tránh 2 admin create đồng thời
      // cùng nhìn thấy một lượng chỗ trống rồi ghi vượt sức chứa thực tế.
      await lockStationRow(tx, input.stationId);

      const [stationOpt, supplier, activeBikesCount, sumCapacity] = await Promise.all([
        Effect.runPromise(txStationRepo.getById(input.stationId)),
        tx.supplier.findUnique({
          where: { id: input.supplierId },
          select: { id: true },
        }),
        tx.bike.count({
          where: {
            status: {
              notIn: ["LOST", "DISABLED"],
            },
          },
        }),
        tx.station.aggregate({
          _sum: {
            totalCapacity: true,
          },
        }),
      ]);

      if (Option.isNone(stationOpt)) {
        throw new BikeStationNotFound({ stationId: input.stationId });
      }

      if (!supplier) {
        throw new BikeSupplierNotFound({ supplierId: input.supplierId });
      }

      const totalCapacity = sumCapacity._sum.totalCapacity ?? 0;
      if (activeBikesCount >= totalCapacity) {
        throw new BikeSystemCapacityExceeded({
          activeBikesCount,
          totalCapacity,
        });
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
  });
}
