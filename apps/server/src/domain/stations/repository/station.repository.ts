import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest } from "@/domain/shared/pagination";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "../../../../generated/prisma/client";
import type {
  NearestStationRow,
  StationRepo,
  StationSortField,
} from "./station.types";

export class StationRepository extends Context.Tag("StationRepository")<
  StationRepository,
  StationRepo
>() {}

export function toStationOrderBy(
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

export function makeStationRepository(client: PrismaClient): StationRepo {
  const stationSelect = {
    id: true,
    name: true,
    address: true,
    capacity: true,
    latitude: true,
    longitude: true,
  } as const;

  return {
    listWithOffset(filter, pageReq) {
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

      return Effect.gen(function* () {
        const [total, items] = yield* Effect.all([
          Effect.promise(() => client.station.count({ where })),
          Effect.promise(() =>
            client.station.findMany({
              where,
              skip,
              take,
              orderBy,
              select: stationSelect,
            }),
          ),
        ]);

        return makePageResult(items, total, page, pageSize);
      });
    },

    getById(id) {
      return Effect.gen(function* () {
        const row = yield* Effect.promise(() =>
          client.station.findUnique({
            where: { id },
            select: stationSelect,
          }),
        );
        return Option.fromNullable(row);
      });
    },

    listNearest({
      latitude,
      longitude,
      maxDistanceMeters,
      page = 1,
      pageSize = 10,
    }) {
      const {
        page: p,
        pageSize: ps,
        skip,
        take,
      } = normalizedPage({
        page,
        pageSize,
      });

      return Effect.gen(function* () {
        const whereRadius
          = maxDistanceMeters != null
            ? Effect.promise<NearestStationRow[]>(
                () =>
                  client.$queryRaw`
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
                    WHERE ST_DWithin(
                      position,
                      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
                      ${maxDistanceMeters}
                    )
                    ORDER BY distance_meters
                    OFFSET ${skip} LIMIT ${take};
                  `,
              )
            : Effect.promise<NearestStationRow[]>(
                () =>
                  client.$queryRaw`
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
                    ORDER BY distance_meters
                    OFFSET ${skip} LIMIT ${take};
                  `,
              );

        const countEffect
          = maxDistanceMeters != null
            ? Effect.promise<number>(() =>
                client
                  .$queryRawUnsafe(
                    `
                    SELECT COUNT(*)::int AS count
                    FROM "stations"
                    WHERE ST_DWithin(
                      position,
                      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                      $3
                    )
                  `,
                    longitude,
                    latitude,
                    maxDistanceMeters,
                  )
                  .then((rows: unknown) =>
                    Number((rows as any[])[0]?.count ?? 0),
                  ),
              )
            : Effect.promise<number>(() =>
                client
                  .$queryRawUnsafe(
                    "SELECT COUNT(*)::int AS count FROM \"stations\"",
                  )
                  .then((rows: unknown) =>
                    Number((rows as any[])[0]?.count ?? 0),
                  ),
              );

        const [items, total] = yield* Effect.all([whereRadius, countEffect]);

        return makePageResult(items, total, p, ps);
      });
    },
  };
}

export const StationRepositoryLive = Layer.effect(
  StationRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeStationRepository(client);
  }),
);
