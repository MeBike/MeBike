import { Effect, Option } from "effect";
import { uuidv7 } from "uuidv7";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import {
  isPrismaRawUniqueViolation,
  isPrismaUniqueViolation,
} from "@/infrastructure/prisma-errors";

import type { StationRepo } from "../station.repository.types";

import {
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

export type StationWriteRepo = Pick<StationRepo, "create" | "update">;

export function makeStationWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): StationWriteRepo {
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
        const pickupSlotLimit = input.pickupSlotLimit ?? input.totalCapacity;
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
              pickupSlotLimit: number;
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
                "pickup_slot_limit",
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
                ${pickupSlotLimit},
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
                "pickup_slot_limit" AS "pickupSlotLimit",
                "return_slot_limit" AS "returnSlotLimit",
                "latitude",
                "longitude",
                "created_at" AS "createdAt",
                "updated_at" AS "updatedAt"
            `,
          catch: cause =>
            isPrismaUniqueViolation(cause) || isPrismaRawUniqueViolation(cause)
              ? new StationNameAlreadyExists({ name: input.name })
              : new StationRepositoryError({
                  operation: "create",
                  cause,
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
        const nextPickupSlotLimit = input.pickupSlotLimit
          ?? (input.totalCapacity != null && existing.pickupSlotLimit === existing.totalCapacity
            ? input.totalCapacity
            : existing.pickupSlotLimit);
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
              pickupSlotLimit: number;
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
                "pickup_slot_limit" = ${nextPickupSlotLimit},
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
                "pickup_slot_limit" AS "pickupSlotLimit",
                "return_slot_limit" AS "returnSlotLimit",
                "latitude",
                "longitude",
                "created_at" AS "createdAt",
                "updated_at" AS "updatedAt"
            `,
          catch: cause =>
            isPrismaUniqueViolation(cause) || isPrismaRawUniqueViolation(cause)
              ? new StationNameAlreadyExists({ name: input.name ?? "unknown" })
              : new StationRepositoryError({
                  operation: "update",
                  cause,
                }),
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
