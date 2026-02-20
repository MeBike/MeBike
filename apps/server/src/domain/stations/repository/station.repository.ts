import { Effect, Layer, Option } from "effect";
import { uuidv7 } from "uuidv7";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";
import {
  isPrismaRawUniqueViolation,
  isPrismaUniqueViolation,
} from "@/infrastructure/prisma-errors";

import type {
  CreateStationInput,
  NearestSearchArgs,
  NearestStationRow,
  StationFilter,
  StationRow,
  StationSortField,
} from "../models";
import type { NearestStationRowDb } from "./station.repository.helpers";

import { StationNameAlreadyExists, StationRepositoryError } from "../errors";
import {
  applyCounts,
  getBikeCounts,

  stationSelect,
} from "./station.repository.helpers";

// TODO: If create/update name is added, handle Station_name_key unique violation → DuplicateStationName
export type StationRepo = {
  create: (
    input: CreateStationInput,
  ) => Effect.Effect<StationRow, StationRepositoryError | StationNameAlreadyExists>;
  listWithOffset: (
    filter: StationFilter,
    pageReq: PageRequest<StationSortField>,
  ) => Effect.Effect<PageResult<StationRow>, StationRepositoryError>;
  getById: (
    id: string,
  ) => Effect.Effect<Option.Option<StationRow>, StationRepositoryError>;
  listNearest: (
    args: NearestSearchArgs,
  ) => Effect.Effect<PageResult<NearestStationRow>, StationRepositoryError>;
};

const makeStationRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeStationRepository(client);
});

export class StationRepository extends Effect.Service<StationRepository>()(
  "StationRepository",
  {
    effect: makeStationRepositoryEffect,
  },
) {}

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

export function makeStationRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): StationRepo {
  return {
    create(input: CreateStationInput) {
      return Effect.gen(function* () {
        const stationId = uuidv7();
        const rows = yield* Effect.tryPromise({
          try: () =>
            client.$queryRaw<{
              id: string;
              name: string;
              address: string;
              capacity: number;
              latitude: number;
              longitude: number;
            }[]>`
              INSERT INTO "Station" (
                "id",
                "name",
                "address",
                "capacity",
                "latitude",
                "longitude",
                "position",
                "updated_at"
              ) VALUES (
                ${stationId},
                ${input.name},
                ${input.address},
                ${input.capacity},
                ${input.latitude},
                ${input.longitude},
                ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
                now()
              )
              RETURNING "id", "name", "address", "capacity", "latitude", "longitude"
            `,
          catch: e =>
            isPrismaUniqueViolation(e) || isPrismaRawUniqueViolation(e)
              ? new StationNameAlreadyExists({ name: input.name })
              : new StationRepositoryError({
                  operation: "create",
                  cause: e,
                }),
        });

        const created = rows[0];
        if (!created) {
          return yield* Effect.fail(
            new StationRepositoryError({
              operation: "create.returning",
              cause: new Error("Station insert returned no rows"),
            }),
          );
        }

        return applyCounts(created, undefined);
      });
    },

    listWithOffset(
      filter: StationFilter,
      pageReq: PageRequest<StationSortField>,
    ) {
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
          Effect.tryPromise({
            try: () => client.station.count({ where }),
            catch: e =>
              new StationRepositoryError({
                operation: "listWithOffset.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.station.findMany({
                where,
                skip,
                take,
                orderBy,
                select: stationSelect,
              }),
            catch: e =>
              new StationRepositoryError({
                operation: "listWithOffset.findMany",
                cause: e,
              }),
          }),
        ]);

        const stationIds = items.map(item => item.id);
        const countsMap = yield* getBikeCounts(client, stationIds);
        const mappedItems = items.map(item =>
          applyCounts(item, countsMap.get(item.id)),
        );

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    getById(id: string) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            client.station.findUnique({
              where: { id },
              select: stationSelect,
            }),
          catch: e =>
            new StationRepositoryError({
              operation: "getById",
              cause: e,
            }),
        });
        if (!row) {
          return Option.none();
        }
        const countsMap = yield* getBikeCounts(client, [row.id]);
        return Option.some(applyCounts(row, countsMap.get(row.id)));
      });
    },

    listNearest({
      latitude,
      longitude,
      maxDistanceMeters,
      page = 1,
      pageSize = 10,
    }: NearestSearchArgs) {
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
            ? Effect.tryPromise(() =>
                client.$queryRaw<NearestStationRowDb[]>`
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
                  FROM "Station"
                  WHERE ST_DWithin(
                    position,
                    ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
                    ${maxDistanceMeters}
                  )
                  ORDER BY distance_meters
                  OFFSET ${skip} LIMIT ${take};
                `,
              ).pipe(
                Effect.catchAll(e =>
                  Effect.fail(
                    new StationRepositoryError({
                      operation: "listNearest.queryWithRadius",
                      cause: e,
                    }),
                  ),
                ),
              )
            : Effect.tryPromise(() =>
                client.$queryRaw<NearestStationRowDb[]>`
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
                  FROM "Station"
                  ORDER BY distance_meters
                  OFFSET ${skip} LIMIT ${take};
                `,
              ).pipe(
                Effect.catchAll(e =>
                  Effect.fail(
                    new StationRepositoryError({
                      operation: "listNearest.queryAll",
                      cause: e,
                    }),
                  ),
                ),
              );

        const countEffect
          = maxDistanceMeters != null
            ? Effect.tryPromise(() =>
                client
                  .$queryRawUnsafe(
                    `
                    SELECT COUNT(*)::int AS count
                    FROM "Station"
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
              ).pipe(
                Effect.catchAll(e =>
                  Effect.fail(
                    new StationRepositoryError({
                      operation: "listNearest.countWithRadius",
                      cause: e,
                    }),
                  ),
                ),
              )
            : Effect.tryPromise(() =>
                client
                  .$queryRawUnsafe(
                    "SELECT COUNT(*)::int AS count FROM \"Station\"",
                  )
                  .then((rows: unknown) =>
                    Number((rows as any[])[0]?.count ?? 0),
                  ),
              ).pipe(
                Effect.catchAll(e =>
                  Effect.fail(
                    new StationRepositoryError({
                      operation: "listNearest.countAll",
                      cause: e,
                    }),
                  ),
                ),
              );

        const [items, total] = yield* Effect.all([whereRadius, countEffect]);
        const stationIds = items.map(item => item.id);
        const countsMap = yield* getBikeCounts(client, stationIds);
        const mappedItems: NearestStationRow[] = items.map((item) => {
          const stationWithCounts = applyCounts(
            item,
            countsMap.get(item.id),
          );
          return {
            ...stationWithCounts,
            distanceMeters: item.distance_meters ?? 0,
          };
        });

        return makePageResult(mappedItems, total, p, ps);
      });
    },
  };
}

export const StationRepositoryLive = Layer.effect(
  StationRepository,
  makeStationRepositoryEffect.pipe(Effect.map(StationRepository.make)),
);

export const stationRepositoryFactory = makeStationRepository;
