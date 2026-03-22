import { Effect } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { StationRow } from "../models";

import { StationRepositoryError } from "../errors";

export const stationSelect = {
  id: true,
  name: true,
  address: true,
  totalCapacity: true,
  pickupSlotLimit: true,
  returnSlotLimit: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type StationBaseRow = PrismaTypes.StationGetPayload<{
  select: typeof stationSelect;
}>;

export type NearestStationRowDb = StationBaseRow & {
  distance_meters: number;
};

export type BikeCounts = Pick<
  StationRow,
  | "totalBikes"
  | "availableBikes"
  | "bookedBikes"
  | "brokenBikes"
  | "reservedBikes"
  | "maintainedBikes"
  | "unavailableBikes"
  | "emptySlots"
>;

function baseCounts(): BikeCounts {
  return {
    totalBikes: 0,
    availableBikes: 0,
    bookedBikes: 0,
    brokenBikes: 0,
    reservedBikes: 0,
    maintainedBikes: 0,
    unavailableBikes: 0,
    emptySlots: 0,
  };
}

export function applyCounts(
  station: StationBaseRow,
  counts: BikeCounts | undefined,
): StationRow {
  const resolved = counts ?? baseCounts();

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
    capacity: station.totalCapacity,
    totalCapacity: station.totalCapacity,
    pickupSlotLimit: station.pickupSlotLimit,
    returnSlotLimit: station.returnSlotLimit,
    latitude: station.latitude,
    longitude: station.longitude,
    ...resolved,
    createdAt,
    updatedAt,
    emptySlots: Math.max(0, station.totalCapacity - resolved.totalBikes),
  };
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
    catch: e =>
      new StationRepositoryError({
        operation: "getBikeCounts.groupBy",
        cause: e,
      }),
  }).pipe(
    Effect.map((rows) => {
      const countsMap = new Map<string, BikeCounts>();
      for (const stationId of stationIds) {
        countsMap.set(stationId, baseCounts());
      }

      for (const row of rows) {
        const stationId = row.stationId;
        if (!stationId) {
          continue;
        }
        const counts = countsMap.get(stationId) ?? baseCounts();
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
          case "MAINTAINED":
            counts.maintainedBikes += inc;
            break;
          case "UNAVAILABLE":
            counts.unavailableBikes += inc;
            break;
        }
        countsMap.set(stationId, counts);
      }

      return countsMap;
    }),
  );
}
