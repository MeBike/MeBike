import { Effect } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { env } from "@/config/env";

import type { StationRow } from "../models";
import type { StationBaseRow } from "./station.repository.select";

import { StationRepositoryError } from "../errors";

export type BikeCounts = Pick<
  StationRow,
  | "totalBikes"
  | "availableBikes"
  | "bookedBikes"
  | "brokenBikes"
  | "reservedBikes"
  | "redistributingBikes"
  | "lostBikes"
  | "disabledBikes"
  | "activeReturnSlots"
  | "availableReturnSlots"
  | "emptySlots"
  | "incomingRedistributionBikes"
>;

export function createEmptyBikeCounts(): BikeCounts {
  return {
    totalBikes: 0,
    availableBikes: 0,
    bookedBikes: 0,
    brokenBikes: 0,
    lostBikes: 0,
    reservedBikes: 0,
    redistributingBikes: 0,
    disabledBikes: 0,
    activeReturnSlots: 0,
    availableReturnSlots: 0,
    emptySlots: 0,
    incomingRedistributionBikes: 0,
  };
}

/**
 * Tính số return slots còn có thể nhận tại station ở thời điểm hiện tại.
 *
 * Giá trị này bị chặn bởi hai giới hạn độc lập:
 * - chỗ vật lý còn lại trong trạm,
 * - giới hạn return-slot do admin cấu hình.
 *
 * `activeReturnSlots` và `incomingRedistributionBikes` đều phải trừ ra vì chúng
 * đã giữ chỗ cho xe sẽ quay về hoặc đang trên đường vào trạm.
 *
 * Hàm này clamp về `0` vì đây là giá trị hiển thị trên resource trả về; API
 * không nên trả số âm cho số lượng slot còn lại.
 */
function computeAvailableReturnSlots(station: StationBaseRow, counts: BikeCounts) {
  return Math.max(
    0,
    Math.min(
      station.totalCapacity - counts.totalBikes - counts.activeReturnSlots - counts.incomingRedistributionBikes,
      station.returnSlotLimit - counts.activeReturnSlots - counts.incomingRedistributionBikes,
    ),
  );
}

/**
 * Gộp station row với các count động để tạo resource trả về cho API.
 *
 * `availableReturnSlots` luôn là giá trị dẫn xuất. Nó phải trừ cả slot đang giữ
 * cho return lẫn xe đang trên đường redistribution vào trạm.
 */
export function applyCounts(
  station: StationBaseRow,
  counts: BikeCounts | undefined,
): StationRow {
  const resolved = counts ?? createEmptyBikeCounts();

  const createdAt
    = station.createdAt instanceof Date
      ? station.createdAt.toISOString()
      : new Date(station.createdAt).toISOString();
  const updatedAt
    = station.updatedAt instanceof Date
      ? station.updatedAt.toISOString()
      : new Date(station.updatedAt).toISOString();

  return {
    id: station.id,
    name: station.name,
    address: station.address,
    stationType: station.stationType,
    agencyId: station.agencyId,
    totalCapacity: station.totalCapacity,
    returnSlotLimit: station.returnSlotLimit,
    latitude: station.latitude,
    longitude: station.longitude,
    ...resolved,
    createdAt,
    updatedAt,
    activeReturnSlots: resolved.activeReturnSlots,
    incomingRedistributionBikes: resolved.incomingRedistributionBikes,
    availableReturnSlots: computeAvailableReturnSlots(station, resolved),
    emptySlots: Math.max(0, station.totalCapacity - resolved.totalBikes),
  };
}

export function resolveStationCounts(args: {
  countsMap: Map<string, BikeCounts>;
  returnSlotCountsMap: Map<string, number>;
  incomingRedistributionCountsMap?: Map<string, number>;
  stationId: string;
}): BikeCounts {
  const counts = args.countsMap.get(args.stationId) ?? createEmptyBikeCounts();

  return {
    ...counts,
    activeReturnSlots: args.returnSlotCountsMap.get(args.stationId) ?? 0,
    incomingRedistributionBikes: args.incomingRedistributionCountsMap?.get(args.stationId) ?? 0,
  };
}

export function getActiveReturnSlotCounts(
  client: PrismaClient | PrismaTypes.TransactionClient,
  stationIds: string[],
  activeAfter = new Date(Date.now() - env.RETURN_SLOT_HOLD_MINUTES * 60_000),
): Effect.Effect<Map<string, number>, StationRepositoryError> {
  if (stationIds.length === 0) {
    return Effect.succeed(new Map());
  }

  return Effect.tryPromise({
    try: () =>
      client.returnSlotReservation.groupBy({
        by: ["stationId"],
        where: {
          stationId: { in: stationIds },
          status: "ACTIVE",
          reservedFrom: { gt: activeAfter },
        },
        _count: { _all: true },
      }),
    catch: cause =>
      new StationRepositoryError({
        operation: "getActiveReturnSlotCounts.groupBy",
        cause,
      }),
  }).pipe(
    Effect.map((rows) => {
      const countsMap = new Map<string, number>();
      for (const stationId of stationIds) {
        countsMap.set(stationId, 0);
      }

      for (const row of rows) {
        if (!row.stationId) {
          continue;
        }

        countsMap.set(row.stationId, row._count._all);
      }

      return countsMap;
    }),
  );
}

export function getBikeCounts(
  client: PrismaClient | PrismaTypes.TransactionClient,
  stationIds: string[],
): Effect.Effect<Map<string, BikeCounts>, StationRepositoryError> {
  if (stationIds.length === 0) {
    return Effect.succeed(new Map());
  }

  return Effect.tryPromise({
    try: () =>
      client.bike.groupBy({
        by: ["stationId", "status"],
        where: {
          stationId: { in: stationIds },
        },
        _count: { _all: true },
      }),
    catch: cause =>
      new StationRepositoryError({
        operation: "getBikeCounts.groupBy",
        cause,
      }),
  }).pipe(
    Effect.map((rows) => {
      const countsMap = new Map<string, BikeCounts>();
      for (const stationId of stationIds) {
        countsMap.set(stationId, createEmptyBikeCounts());
      }

      for (const row of rows) {
        const stationId = row.stationId;
        if (!stationId) {
          continue;
        }

        const counts = countsMap.get(stationId) ?? createEmptyBikeCounts();
        const inc = row._count._all;
        counts.totalBikes += inc;

        switch (row.status) {
          case "AVAILABLE":
            counts.availableBikes += inc;
            break;
          case "BOOKED":
            counts.bookedBikes += inc;
            break;
          case "BROKEN":
            counts.brokenBikes += inc;
            break;
          case "RESERVED":
            counts.reservedBikes += inc;
            break;
          case "REDISTRIBUTING":
            counts.redistributingBikes += inc;
            break;
          case "DISABLED":
            counts.disabledBikes += inc;
            break;
          case "LOST":
            counts.lostBikes += inc;
            break;
        }

        countsMap.set(stationId, counts);
      }

      return countsMap;
    }),
  );
}

export function getIncomingRedistributionCounts(
  client: PrismaClient | PrismaTypes.TransactionClient,
  stationIds: string[],
): Effect.Effect<Map<string, number>, StationRepositoryError> {
  if (stationIds.length === 0) {
    return Effect.succeed(new Map());
  }

  return Effect.tryPromise({
    try: () =>
      client.redistributionRequest.findMany({
        where: {
          targetStationId: { in: stationIds },
          status: { in: ["APPROVED", "IN_TRANSIT", "PARTIALLY_COMPLETED"] },
        },
        select: {
          targetStationId: true,
          _count: {
            select: {
              items: {
                where: { deliveredAt: null },
              },
            },
          },
        },
      }),
    catch: cause =>
      new StationRepositoryError({
        operation: "getIncomingRedistributionCounts.findMany",
        cause,
      }),
  }).pipe(
    Effect.map((rows) => {
      const countsMap = new Map<string, number>();
      for (const stationId of stationIds) {
        countsMap.set(stationId, 0);
      }

      for (const row of rows) {
        if (!row.targetStationId) {
          continue;
        }

        const current = countsMap.get(row.targetStationId) ?? 0;
        countsMap.set(row.targetStationId, current + row._count.items);
      }

      return countsMap;
    }),
  );
}
