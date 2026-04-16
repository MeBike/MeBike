import { Effect } from "effect";

import type { PageRequest } from "@/domain/shared/pagination";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { pickDefined } from "@/domain/shared/pick-defined";

import type { StationFilter, StationRow, StationSortField } from "../models";

import { StationRepositoryError } from "../errors";

export const stationSelect = {
  id: true,
  name: true,
  address: true,
  stationType: true,
  agencyId: true,
  totalCapacity: true,
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
  | "activeReturnSlots"
  | "availableReturnSlots"
  | "emptySlots"
>;

export function createEmptyBikeCounts(): BikeCounts {
  return {
    totalBikes: 0,
    availableBikes: 0,
    bookedBikes: 0,
    brokenBikes: 0,
    reservedBikes: 0,
    maintainedBikes: 0,
    unavailableBikes: 0,
    activeReturnSlots: 0,
    availableReturnSlots: 0,
    emptySlots: 0,
  };
}

function computeAvailableReturnSlots(station: StationBaseRow, counts: BikeCounts) {
  return Math.max(
    0,
    Math.min(
      station.totalCapacity - counts.totalBikes - counts.activeReturnSlots,
      station.returnSlotLimit - counts.activeReturnSlots,
    ),
  );
}

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
    availableReturnSlots: computeAvailableReturnSlots(station, resolved),
    emptySlots: Math.max(0, station.totalCapacity - resolved.totalBikes),
  };
}

export function resolveStationCounts(args: {
  countsMap: Map<string, BikeCounts>;
  returnSlotCountsMap: Map<string, number>;
  stationId: string;
}): BikeCounts {
  const counts = args.countsMap.get(args.stationId) ?? createEmptyBikeCounts();

  return {
    ...counts,
    activeReturnSlots: args.returnSlotCountsMap.get(args.stationId) ?? 0,
  };
}

export function toStationOrderBy(
  req: PageRequest<StationSortField>,
): PrismaTypes.StationOrderByWithRelationInput {
  const sortBy: StationSortField = req.sortBy ?? "name";
  const sortDir = req.sortDir ?? "asc";
  switch (sortBy) {
    case "totalCapacity":
      return { totalCapacity: sortDir };
    case "updatedAt":
      return { updatedAt: sortDir };
    case "name":
    default:
      return { name: sortDir };
  }
}

export function toStationWhere(filter: StationFilter): PrismaTypes.StationWhereInput {
  return {
    ...pickDefined({
      name: filter.name
        ? { contains: filter.name, mode: "insensitive" }
        : undefined,
      address: filter.address
        ? { contains: filter.address, mode: "insensitive" }
        : undefined,
      stationType: filter.stationType,
      agencyId: filter.agencyId,
      totalCapacity: filter.totalCapacity,
    }),
    ...(filter.excludeAssignedStaff && {
      userAssignments: {
        none: {
          user: {
            role: "STAFF",
          },
        },
      },
    }),
  };
}

export function getActiveReturnSlotCounts(
  client: PrismaClient | PrismaTypes.TransactionClient,
  stationIds: string[],
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
        },
        _count: { _all: true },
      }),
    catch: e =>
      new StationRepositoryError({
        operation: "getActiveReturnSlotCounts.groupBy",
        cause: e,
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
    catch: e =>
      new StationRepositoryError({
        operation: "getBikeCounts.groupBy",
        cause: e,
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
