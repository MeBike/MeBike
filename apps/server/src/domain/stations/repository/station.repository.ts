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
  UpdateStationInput,
} from "../models";
import type { NearestStationRowDb } from "./station.repository.helpers";

import {
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
  StationRepositoryError,
} from "../errors";
import {
  applyCounts,
  getBikeCounts,

  stationSelect,
} from "./station.repository.helpers";

// TODO: If create/update name is added, handle Station_name_key unique violation → DuplicateStationName
export type StationRepo = {
  create: (
    input: CreateStationInput,
  ) => Effect.Effect<
    StationRow,
    StationRepositoryError | StationNameAlreadyExists | StationOutsideSupportedArea
  >;
  update: (
    id: string,
    input: UpdateStationInput,
  ) => Effect.Effect<
    Option.Option<StationRow>,
    StationRepositoryError | StationNameAlreadyExists | StationOutsideSupportedArea
  >;
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
        const supportedAreaRows = yield* Effect.tryPromise({
          try: () =>
            client.$queryRaw<{ inside: boolean }[]>`
              SELECT ST_Covers(
                "geom",
                ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geometry
              ) AS "inside"
              FROM "GeoBoundary"
              WHERE "code" = 'VN'
              LIMIT 1
            `,
          catch: e =>
            new StationRepositoryError({
              operation: "create.checkSupportedArea",
              cause: e,
            }),
        });

        const supportedArea = supportedAreaRows[0];
        if (!supportedArea) {
          return yield* Effect.fail(
            new StationRepositoryError({
              operation: "create.checkSupportedArea.missingBoundary",
              cause: new Error("Missing GeoBoundary row for code VN"),
            }),
          );
        }
        if (!supportedArea.inside) {
          return yield* Effect.fail(
            new StationOutsideSupportedArea({
              latitude: input.latitude,
              longitude: input.longitude,
            }),
          );
        }

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

    update(id: string, input: UpdateStationInput) {
      return Effect.gen(function* () {
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
              WITH boundary AS (
                SELECT "geom"
                FROM "GeoBoundary"
                WHERE "code" = 'VN'
                LIMIT 1
              )
              UPDATE "Station"
              SET
                "name" = COALESCE(${input.name}, "Station"."name"),
                "address" = COALESCE(${input.address}, "Station"."address"),
                "capacity" = COALESCE(${input.capacity}, "Station"."capacity"),
                "latitude" = COALESCE(${input.latitude}, "Station"."latitude"),
                "longitude" = COALESCE(${input.longitude}, "Station"."longitude"),
                "position" = ST_SetSRID(
                  ST_MakePoint(
                    COALESCE(${input.longitude}, "Station"."longitude"),
                    COALESCE(${input.latitude}, "Station"."latitude")
                  ),
                  4326
                )::geography,
                "updated_at" = now()
              FROM boundary
              WHERE "Station"."id" = ${id}
                AND ST_Covers(
                  boundary."geom",
                  ST_SetSRID(
                    ST_MakePoint(
                      COALESCE(${input.longitude}, "Station"."longitude"),
                      COALESCE(${input.latitude}, "Station"."latitude")
                    ),
                    4326
                  )::geometry
                )
              RETURNING "id", "name", "address", "capacity", "latitude", "longitude"
            `,
          catch: e =>
            isPrismaUniqueViolation(e) || isPrismaRawUniqueViolation(e)
              ? new StationNameAlreadyExists({ name: input.name ?? "unknown" })
              : new StationRepositoryError({
                  operation: "update",
                  cause: e,
                }),
        });

        const updated = rows[0];
        if (updated) {
          const countsMap = yield* getBikeCounts(client, [updated.id]);
          return Option.some(applyCounts(updated, countsMap.get(updated.id)));
        }

        const probeRows = yield* Effect.tryPromise({
          try: () =>
            client.$queryRaw<{
              exists: boolean;
              hasBoundary: boolean;
              inside: boolean;
              latitude: number | null;
              longitude: number | null;
            }[]>`
              WITH target AS (
                SELECT "latitude", "longitude"
                FROM "Station"
                WHERE "id" = ${id}
                LIMIT 1
              ),
              boundary AS (
                SELECT "geom"
                FROM "GeoBoundary"
                WHERE "code" = 'VN'
                LIMIT 1
              )
              SELECT
                EXISTS(SELECT 1 FROM target) AS "exists",
                EXISTS(SELECT 1 FROM boundary) AS "hasBoundary",
                COALESCE((
                  SELECT ST_Covers(
                    b."geom",
                    ST_SetSRID(
                      ST_MakePoint(
                        COALESCE(${input.longitude}, t."longitude"),
                        COALESCE(${input.latitude}, t."latitude")
                      ),
                      4326
                    )::geometry
                  )
                  FROM target t
                  CROSS JOIN boundary b
                ), false) AS "inside",
                (SELECT COALESCE(${input.latitude}, t."latitude") FROM target t LIMIT 1) AS "latitude",
                (SELECT COALESCE(${input.longitude}, t."longitude") FROM target t LIMIT 1) AS "longitude"
            `,
          catch: e =>
            new StationRepositoryError({
              operation: "update.probe",
              cause: e,
            }),
        });

        const probe = probeRows[0];
        if (!probe) {
          return Option.none();
        }
        if (!probe.hasBoundary) {
          return yield* Effect.fail(
            new StationRepositoryError({
              operation: "update.probe.missingBoundary",
              cause: new Error("Missing GeoBoundary row for code VN"),
            }),
          );
        }
        if (!probe.exists) {
          return Option.none();
        }
        if (!probe.inside) {
          return yield* Effect.fail(
            new StationOutsideSupportedArea({
              latitude: probe.latitude ?? input.latitude ?? 0,
              longitude: probe.longitude ?? input.longitude ?? 0,
            }),
          );
        }
        return Option.none();
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
