import { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type { Prisma as PrismaTypes } from "../../../../generated/prisma/client";
import type { StationFilter, StationSortField } from "./station.types";

type StationRow = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
};
type NearestStationRow = StationRow & { distance_meters: number };

export function listStationsWithOffset(
  filter: StationFilter,
  pageReq: PageRequest<StationSortField>,
): Effect.Effect<PageResult<StationRow>, never, Prisma> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;

    const { page, pageSize, skip, take } = normalizedPage(pageReq);

    const where: PrismaTypes.StationWhereInput = {
      ...(filter.name && {
        name: { contains: filter.name, mode: "insensitive" },
      }),
      ...(filter.address && {
        address: { contains: filter.address, mode: "insensitive" },
      }),
      ...(filter.capacity != null && { capacity: filter.capacity }),
    };
    const orderBy = toStationOrderBy(pageReq);

    const [total, items] = yield* Effect.all([
      Effect.promise(() => client.station.count({ where })),
      Effect.promise(() =>
        client.station.findMany({
          where,
          skip,
          take,
          orderBy,
          select: {
            id: true,
            name: true,
            address: true,
            capacity: true,
            latitude: true,
            longitude: true,
          },
        }),
      ),
    ]);

    return makePageResult(items, total, page, pageSize);
  });
}
function toStationOrderBy(
  req: PageRequest<StationSortField>,
): PrismaTypes.StationOrderByWithRelationInput {
  const sortBy: StationSortField = req.sortBy ?? "name";
  const sortDir = req.sortDir ?? "asc";
  switch (sortBy) {
    case "capacity":
      return { capacity: sortDir };
    case "updatedAt":
      return { updatedAt: sortDir };
    case "name":
    default:
      return { name: sortDir };
  }
}
export function getStationById(
  id: string,
): Effect.Effect<Option.Option<StationRow>, never, Prisma> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const station = yield* Effect.promise(() =>
      client.station.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          address: true,
          capacity: true,
          latitude: true,
          longitude: true,
        },
      }),
    );
    return station ? Option.some(station) : Option.none<StationRow>();
  });
}

export function listNearestStations(params: {
  latitude: number;
  longitude: number;
  maxDistanceMeters?: number;
  page?: number;
  pageSize?: number;
}): Effect.Effect<PageResult<NearestStationRow>, never, Prisma> {
  const {
    latitude,
    longitude,
    maxDistanceMeters,
    page = 1,
    pageSize = 10,
  } = params;
  const { page: p, pageSize: size, skip, take } = normalizedPage({ page, pageSize });

  return Effect.gen(function* () {
    const { client } = yield* Prisma;

    const rows = yield* Effect.promise(() =>
      client.$queryRaw<NearestStationRow[]>`
        SELECT
          id,
          name,
          address,
          capacity,
          latitude,
          longitude,
          ST_Distance(
            position,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          ) AS distance_meters
        FROM "stations"
        WHERE ${maxDistanceMeters ?? null} IS NULL
          OR ST_DWithin(
            position,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${maxDistanceMeters ?? 0}
          )
        ORDER BY distance_meters
        OFFSET ${skip}
        LIMIT ${take}
      `,
    );

    const total = yield* Effect.promise(() =>
      client.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM "stations"
        WHERE ${maxDistanceMeters ?? null} IS NULL
          OR ST_DWithin(
            position,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${maxDistanceMeters ?? 0}
          )
      `,
    );
    const totalCount = total.length ? Number(total[0].count) : 0;

    return makePageResult(rows, totalCount, p, size);
  });
}
