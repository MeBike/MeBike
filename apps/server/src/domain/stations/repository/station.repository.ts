import { Effect } from "effect";

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
export function getStationById() {}
export function listNearestStations() {}
