import { Effect, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { makeStationQueryRepository } from "@/domain/stations/repository/station-query.repository";

import type { CreateBikeInput } from "./bike-command.service.types";

import {
  BikeRepositoryError,
  BikeStationNotFound,
  BikeStationPlacementCapacityExceeded,
  BikeSupplierNotFound,
} from "../../domain-errors";
import { makeBikeRepository } from "../../repository/bike.repository";
import {
  getAvailablePlacementSlots,
  isBikeCreateDomainPassThroughError,
  lockStationRow,
} from "./bike-command.helpers";

export function createBikeWithGuards(client: PrismaClient, input: CreateBikeInput) {
  return Effect.tryPromise({
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
  });
}
