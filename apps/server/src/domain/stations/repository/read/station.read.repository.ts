import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";

import type {
  NearestSearchArgs,
  NearestStationRow,
  StationContextRow,
  StationWorkerRow,
} from "../../models";
import type { StationQueryRepo } from "../station.repository.types";

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
  StationQueryRepo,
  | "listWithOffset"
  | "getById"
  | "getByAgencyId"
  | "existsByExactLocation"
  | "findIdNameAddressByIds"
  | "listContextExcludingId"
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

  const loadWorkers = (stationId: string) =>
    Effect.tryPromise({
      try: () =>
        client.userOrgAssignment.findMany({
          where: {
            OR: [
              {
                stationId,
                user: {
                  role: { in: ["STAFF", "MANAGER"] },
                },
              },
              {
                technicianTeam: { stationId },
                user: {
                  role: "TECHNICIAN",
                },
              },
            ],
          },
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
            technicianTeam: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      catch: cause =>
        new StationRepositoryError({
          operation: "getById.loadWorkers",
          cause,
        }),
    }).pipe(
      Effect.map((rows): StationWorkerRow[] => {
        const roleRank = {
          MANAGER: 0,
          STAFF: 1,
          TECHNICIAN: 2,
        } as const;

        return rows
          .map(row => ({
            userId: row.user.id,
            fullName: row.user.fullName,
            role: row.user.role as StationWorkerRow["role"],
            technicianTeamId: row.technicianTeam?.id ?? null,
            technicianTeamName: row.technicianTeam?.name ?? null,
          }))
          .sort((left, right) => {
            const rankDiff = roleRank[left.role] - roleRank[right.role];

            return rankDiff !== 0
              ? rankDiff
              : left.fullName.localeCompare(right.fullName);
          });
      }),
    );

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

        const [[station], workers] = yield* Effect.all([
          attachCounts([row], (item, counts) => applyCounts(item, counts)),
          loadWorkers(id),
        ]);

        return Option.some({
          ...station,
          workers,
        });
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

    existsByExactLocation({ address, latitude, longitude }) {
      return Effect.tryPromise({
        try: () =>
          client.station.findFirst({
            where: {
              address,
              latitude,
              longitude,
            },
            select: { id: true },
          }),
        catch: cause =>
          new StationRepositoryError({
            operation: "existsByExactLocation",
            cause,
          }),
      }).pipe(
        Effect.map(row => row !== null),
        defectOn(StationRepositoryError),
      );
    },

    findIdNameAddressByIds(ids) {
      if (ids.length === 0) {
        return Effect.succeed([]);
      }

      return Effect.tryPromise({
        try: () =>
          client.station.findMany({
            where: { id: { in: [...ids] } },
            select: {
              id: true,
              name: true,
              address: true,
            },
          }),
        catch: cause =>
          new StationRepositoryError({
            operation: "findIdNameAddressByIds",
            cause,
          }),
      }).pipe(defectOn(StationRepositoryError));
    },

    listContextExcludingId(excludedId) {
      return Effect.tryPromise({
        try: () =>
          client.station.findMany({
            where: { id: { not: excludedId } },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              address: true,
            },
          }),
        catch: cause =>
          new StationRepositoryError({
            operation: "listContextExcludingId",
            cause,
          }),
      }).pipe(
        Effect.map((rows): StationContextRow[] => rows),
        defectOn(StationRepositoryError),
      );
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
