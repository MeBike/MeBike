import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";

import type { NearestSearchArgs, NearestStationRow } from "../../models";
import type { StationRepo } from "../station.repository.types";

import { StationRepositoryError } from "../../errors";
import {
  applyCounts,
  getActiveReturnSlotCounts,
  getBikeCounts,
  resolveStationCounts,
  stationSelect,
  toStationOrderBy,
  toStationWhere,
} from "../station.repository.helpers";

type StationNearestRowDb = PrismaTypes.StationGetPayload<{
  select: typeof stationSelect;
}> & {
  distance_meters: number;
};

export type StationReadRepo = Pick<
  StationRepo,
  | "listWithOffset"
  | "getById"
  | "getByAgencyId"
  | "listNearest"
>;

export function makeStationReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): StationReadRepo {
  const attachCounts = <TRow extends { id: string }, TMapped>(
    rows: ReadonlyArray<TRow>,
    mapRow: (row: TRow, counts: ReturnType<typeof resolveStationCounts>) => TMapped,
  ) =>
    Effect.gen(function* () {
      const stationIds = rows.map(row => row.id);
      const [countsMap, returnSlotCountsMap] = yield* Effect.all([
        getBikeCounts(client, stationIds),
        getActiveReturnSlotCounts(client, stationIds),
      ]);

      return rows.map(row =>
        mapRow(
          row,
          resolveStationCounts({
            countsMap,
            returnSlotCountsMap,
            stationId: row.id,
          }),
        ));
    });

  return {
    listWithOffset(filter, pageReq) {
      const { page, pageSize, skip, take } = normalizedPage(pageReq);
      const where = toStationWhere(filter);
      const orderBy = toStationOrderBy(pageReq);

      return Effect.gen(function* () {
        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.station.count({ where }),
            catch: cause =>
              new StationRepositoryError({
                operation: "listWithOffset.count",
                cause,
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
            catch: cause =>
              new StationRepositoryError({
                operation: "listWithOffset.findMany",
                cause,
              }),
          }),
        ]);

        const mappedItems = yield* attachCounts(items, (item, counts) =>
          applyCounts(item, counts));

        return makePageResult(mappedItems, total, page, pageSize);
      }).pipe(defectOn(StationRepositoryError));
    },

    getById(id) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            client.station.findUnique({
              where: { id },
              select: stationSelect,
            }),
          catch: cause =>
            new StationRepositoryError({
              operation: "getById",
              cause,
            }),
        });

        if (!row) {
          return Option.none();
        }

        const [station] = yield* attachCounts([row], (item, counts) =>
          applyCounts(item, counts));

        return Option.some(station);
      }).pipe(defectOn(StationRepositoryError));
    },

    getByAgencyId(agencyId) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            client.station.findUnique({
              where: { agencyId },
              select: stationSelect,
            }),
          catch: cause =>
            new StationRepositoryError({
              operation: "getByAgencyId",
              cause,
            }),
        });

        if (!row) {
          return Option.none();
        }

        const [station] = yield* attachCounts([row], (item, counts) =>
          applyCounts(item, counts));

        return Option.some(station);
      }).pipe(defectOn(StationRepositoryError));
    },

    listNearest({
      latitude,
      longitude,
      maxDistanceMeters,
      page = 1,
      pageSize = 10,
    }: NearestSearchArgs) {
      const {
        page: resolvedPage,
        pageSize: resolvedPageSize,
        skip,
        take,
      } = normalizedPage({ page, pageSize });

      return Effect.gen(function* () {
        const itemsEffect
          = maxDistanceMeters != null
            ? Effect.tryPromise(() =>
                client.$queryRaw<StationNearestRowDb[]>`
                  SELECT
                    id,
                    name,
                    address,
                    station_type AS "stationType",
                    agency_id AS "agencyId",
                    total_capacity AS "totalCapacity",
                    pickup_slot_limit AS "pickupSlotLimit",
                    return_slot_limit AS "returnSlotLimit",
                    latitude,
                    longitude,
                    "created_at" AS "createdAt",
                    "updated_at" AS "updatedAt",
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
                Effect.catchAll(cause =>
                  Effect.fail(
                    new StationRepositoryError({
                      operation: "listNearest.queryWithRadius",
                      cause,
                    }),
                  ),
                ),
              )
            : Effect.tryPromise(() =>
                client.$queryRaw<StationNearestRowDb[]>`
                  SELECT
                    id,
                    name,
                    address,
                    station_type AS "stationType",
                    agency_id AS "agencyId",
                    total_capacity AS "totalCapacity",
                    pickup_slot_limit AS "pickupSlotLimit",
                    return_slot_limit AS "returnSlotLimit",
                    latitude,
                    longitude,
                    "created_at" AS "createdAt",
                    "updated_at" AS "updatedAt",
                    ST_Distance(
                      position,
                      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
                    ) AS distance_meters
                  FROM "Station"
                  ORDER BY distance_meters
                  OFFSET ${skip} LIMIT ${take};
                `,
              ).pipe(
                Effect.catchAll(cause =>
                  Effect.fail(
                    new StationRepositoryError({
                      operation: "listNearest.queryAll",
                      cause,
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
                  .then((rows: unknown) => Number((rows as Array<{ count?: number }>)[0]?.count ?? 0)),
              ).pipe(
                Effect.catchAll(cause =>
                  Effect.fail(
                    new StationRepositoryError({
                      operation: "listNearest.countWithRadius",
                      cause,
                    }),
                  ),
                ),
              )
            : Effect.tryPromise(() =>
                client
                  .$queryRawUnsafe("SELECT COUNT(*)::int AS count FROM \"Station\"")
                  .then((rows: unknown) => Number((rows as Array<{ count?: number }>)[0]?.count ?? 0)),
              ).pipe(
                Effect.catchAll(cause =>
                  Effect.fail(
                    new StationRepositoryError({
                      operation: "listNearest.countAll",
                      cause,
                    }),
                  ),
                ),
              );

        const [items, total] = yield* Effect.all([itemsEffect, countEffect]);

        const mappedItems = yield* attachCounts(items, (item, counts): NearestStationRow => ({
          ...applyCounts(item, counts),
          distanceMeters: item.distance_meters ?? 0,
        }));

        return makePageResult(mappedItems, total, resolvedPage, resolvedPageSize);
      }).pipe(defectOn(StationRepositoryError));
    },
  };
}
