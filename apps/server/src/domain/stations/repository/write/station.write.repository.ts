import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import {
  getPrismaRawUniqueViolationConstraint,
  getPrismaUniqueViolationTarget,
  isPrismaRawUniqueViolation,
  isPrismaUniqueViolation,
} from "@/infrastructure/prisma-errors";

import type { StationCommandRepo } from "../station.repository.types";

import {
  StationLocationAlreadyExists,
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
  StationRepositoryError,
} from "../../errors";
import {
  applyCounts,
  getActiveReturnSlotCounts,
  getBikeCounts,
  resolveStationCounts,
  stationSelect,
} from "../station.repository.helpers";

export type StationWriteRepo = Pick<StationCommandRepo, "create" | "update">;

/**
 * Tao write repository cho station domain.
 *
 * @param client Prisma client hoac transaction client.
 * @returns Repository gom create/update voi validate geo boundary va hydrate counts.
 */
export function makeStationWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): StationWriteRepo {
  const EXACT_LOCATION_CONSTRAINT = "uq_station_exact_location";

  const isLocationConstraintTarget = (target: string | string[] | undefined) => {
    if (typeof target === "string") {
      return target === EXACT_LOCATION_CONSTRAINT;
    }

    return Array.isArray(target)
      && target.length === 3
      && target.includes("address")
      && target.includes("latitude")
      && target.includes("longitude");
  };

  const mapStationUniqueViolation = (cause: unknown, args: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    const target = getPrismaUniqueViolationTarget(cause);
    const rawConstraint = getPrismaRawUniqueViolationConstraint(cause);

    if (isLocationConstraintTarget(target) || rawConstraint === EXACT_LOCATION_CONSTRAINT) {
      return new StationLocationAlreadyExists({
        address: args.address,
        latitude: args.latitude,
        longitude: args.longitude,
      });
    }

    if (isPrismaUniqueViolation(cause) || isPrismaRawUniqueViolation(cause)) {
      return new StationNameAlreadyExists({ name: args.name });
    }

    return new StationRepositoryError({
      operation: "unknown",
      cause,
    });
  };

  /**
   * Dam bao toa do tram nam trong geo boundary duoc ho tro.
   *
   * @param args Toa do va loai thao tac dang thuc hien.
   * @param args.latitude Vi do can kiem tra.
   * @param args.longitude Kinh do can kiem tra.
   * @param args.operation Ten thao tac dang thuc hien de gan vao error context.
   * @returns Effect fail neu diem nam ngoai supported area hoac thieu boundary row.
   */
  const assertWithinSupportedArea = (args: {
    latitude: number;
    longitude: number;
    operation: "create" | "update";
  }) =>
    Effect.gen(function* () {
      const supportedAreaRows = yield* Effect.tryPromise({
        try: () =>
          client.$queryRaw<{ inside: boolean }[]>`
            SELECT ST_Covers(
              "geom",
              ST_SetSRID(ST_MakePoint(${args.longitude}, ${args.latitude}), 4326)::geometry
            ) AS "inside"
            FROM "GeoBoundary"
            WHERE "code" = 'VN'
            LIMIT 1
          `,
        catch: cause =>
          new StationRepositoryError({
            operation: `${args.operation}.checkSupportedArea`,
            cause,
          }),
      });

      const supportedArea = supportedAreaRows[0];
      if (!supportedArea) {
        return yield* Effect.fail(
          new StationRepositoryError({
            operation: `${args.operation}.checkSupportedArea.missingBoundary`,
            cause: new Error("Missing GeoBoundary row for code VN"),
          }),
        );
      }

      if (!supportedArea.inside) {
        return yield* Effect.fail(
          new StationOutsideSupportedArea({
            latitude: args.latitude,
            longitude: args.longitude,
          }),
        );
      }
    });

  /**
   * Doc lai tram va hydrate bike/return-slot counts sau khi ghi du lieu.
   *
   * @param id ID tram can hydrate.
   * @returns Effect tra ve `Option.none` neu tram khong ton tai.
   */
  const loadStationWithCounts = (id: string) =>
    Effect.gen(function* () {
      const row = yield* Effect.tryPromise({
        try: () =>
          client.station.findUnique({
            where: { id },
            select: stationSelect,
          }),
        catch: cause =>
          new StationRepositoryError({
            operation: "loadStationWithCounts",
            cause,
          }),
      });

      if (!row) {
        return Option.none<import("../../models").StationRow>();
      }

      const [countsMap, returnSlotCountsMap] = yield* Effect.all([
        getBikeCounts(client, [id]),
        getActiveReturnSlotCounts(client, [id]),
      ]);

      return Option.some(
        applyCounts(
          row,
          resolveStationCounts({
            countsMap,
            returnSlotCountsMap,
            stationId: id,
          }),
        ),
      );
    });

  return {
    create(input) {
      return Effect.gen(function* () {
        yield* assertWithinSupportedArea({
          latitude: input.latitude,
          longitude: input.longitude,
          operation: "create",
        });

        const stationId = uuidv7();
        const stationType = input.stationType ?? "INTERNAL";
        const agencyId = input.agencyId ?? null;
        const returnSlotLimit = input.returnSlotLimit ?? input.totalCapacity;

        const rows = yield* Effect.tryPromise({
          try: () =>
            client.$queryRaw<{
              id: string;
              name: string;
              address: string;
              stationType: import("generated/prisma/client").StationType;
              agencyId: string | null;
              totalCapacity: number;
              returnSlotLimit: number;
              latitude: number;
              longitude: number;
              createdAt: Date;
              updatedAt: Date;
            }[]>`
              INSERT INTO "Station" (
                "id",
                "name",
                "address",
                "station_type",
                "agency_id",
                "total_capacity",
                "return_slot_limit",
                "latitude",
                "longitude",
                "position",
                "updated_at"
              ) VALUES (
                ${stationId},
                ${input.name},
                ${input.address},
                ${stationType}::"station_type",
                ${agencyId},
                ${input.totalCapacity},
                ${returnSlotLimit},
                ${input.latitude},
                ${input.longitude},
                ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
                now()
              )
              RETURNING
                "id",
                "name",
                "address",
                "station_type" AS "stationType",
                "agency_id" AS "agencyId",
                "total_capacity" AS "totalCapacity",
                "return_slot_limit" AS "returnSlotLimit",
                "latitude",
                "longitude",
                "created_at" AS "createdAt",
                "updated_at" AS "updatedAt"
            `,
          catch: (cause) => {
            if (isPrismaUniqueViolation(cause) || isPrismaRawUniqueViolation(cause)) {
              const mapped = mapStationUniqueViolation(cause, {
                name: input.name,
                address: input.address,
                latitude: input.latitude,
                longitude: input.longitude,
              });

              if (mapped instanceof StationRepositoryError) {
                return new StationRepositoryError({
                  operation: "create",
                  cause,
                });
              }

              return mapped;
            }

            return new StationRepositoryError({
              operation: "create",
              cause,
            });
          },
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
      }).pipe(defectOn(StationRepositoryError));
    },

    update(id, input) {
      return Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.station.findUnique({
              where: { id },
              select: stationSelect,
            }),
          catch: cause =>
            new StationRepositoryError({
              operation: "update.findExisting",
              cause,
            }),
        });

        if (!existing) {
          return Option.none();
        }

        const nextLatitude = input.latitude ?? existing.latitude;
        const nextLongitude = input.longitude ?? existing.longitude;
        const nextStationType = input.stationType ?? existing.stationType;
        const nextAgencyId = input.agencyId === undefined ? existing.agencyId : input.agencyId;
        const nextCapacity = input.totalCapacity ?? existing.totalCapacity;
        const nextReturnSlotLimit = input.returnSlotLimit
          ?? (input.totalCapacity != null && existing.returnSlotLimit === existing.totalCapacity
            ? input.totalCapacity
            : existing.returnSlotLimit);

        yield* assertWithinSupportedArea({
          latitude: nextLatitude,
          longitude: nextLongitude,
          operation: "update",
        });

        const rows = yield* Effect.tryPromise({
          try: () =>
            client.$queryRaw<{
              id: string;
              name: string;
              address: string;
              stationType: import("generated/prisma/client").StationType;
              agencyId: string | null;
              totalCapacity: number;
              returnSlotLimit: number;
              latitude: number;
              longitude: number;
              createdAt: Date;
              updatedAt: Date;
            }[]>`
              UPDATE "Station"
              SET
                "name" = ${input.name ?? existing.name},
                "address" = ${input.address ?? existing.address},
                "station_type" = ${nextStationType}::"station_type",
                "agency_id" = ${nextAgencyId},
                "total_capacity" = ${nextCapacity},
                "return_slot_limit" = ${nextReturnSlotLimit},
                "latitude" = ${nextLatitude},
                "longitude" = ${nextLongitude},
                "position" = ST_SetSRID(
                  ST_MakePoint(${nextLongitude}, ${nextLatitude}),
                  4326
                )::geography,
                "updated_at" = now()
              WHERE "Station"."id" = ${id}
              RETURNING
                "id",
                "name",
                "address",
                "station_type" AS "stationType",
                "agency_id" AS "agencyId",
                "total_capacity" AS "totalCapacity",
                "return_slot_limit" AS "returnSlotLimit",
                "latitude",
                "longitude",
                "created_at" AS "createdAt",
                "updated_at" AS "updatedAt"
            `,
          catch: (cause) => {
            if (isPrismaUniqueViolation(cause) || isPrismaRawUniqueViolation(cause)) {
              const mapped = mapStationUniqueViolation(cause, {
                name: input.name ?? existing.name,
                address: input.address ?? existing.address,
                latitude: nextLatitude,
                longitude: nextLongitude,
              });

              if (mapped instanceof StationRepositoryError) {
                return new StationRepositoryError({
                  operation: "update",
                  cause,
                });
              }

              return mapped;
            }

            return new StationRepositoryError({
              operation: "update",
              cause,
            });
          },
        });

        const updated = rows[0];
        if (!updated) {
          return Option.none();
        }

        return yield* loadStationWithCounts(updated.id);
      }).pipe(defectOn(StationRepositoryError));
    },
  };
}
