import { Effect, Option } from "effect";

import type { StationRepositoryError } from "@/domain/stations";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import {
  applyCounts,
  getActiveReturnSlotCounts,
  getBikeCounts,
  getIncomingRedistributionCounts,
  resolveStationCounts,
} from "@/domain/stations/repository/station.repository.counts";
import { stationSelect } from "@/domain/stations/repository/station.repository.select";

import type { AgencyDetailRow } from "../../models";
import type { AgencyRepo } from "../agency.repository.types";

import { AgencyRepositoryError } from "../../domain-errors";
import {
  selectAgencyRow,
  toAgencyOrderBy,
  toAgencyRow,
  toAgencyWhere,
} from "../agency.repository.helpers";

export type AgencyReadRepo = Pick<AgencyRepo, "getById" | "listWithOffset"> & {
  readonly getDetailById: (id: string) => Effect.Effect<Option.Option<AgencyDetailRow>, AgencyRepositoryError | StationRepositoryError>;
};

export function makeAgencyReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): AgencyReadRepo {
  return {
    getById(id) {
      return Effect.tryPromise({
        try: () =>
          client.agency.findUnique({
            where: { id },
            select: selectAgencyRow,
          }),
        catch: cause =>
          new AgencyRepositoryError({
            operation: "getById",
            cause,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toAgencyRow))),
      );
    },

    listWithOffset(filter, pageReq) {
      const { page, pageSize, skip, take } = normalizedPage(pageReq);
      const where = toAgencyWhere(filter);
      const orderBy = toAgencyOrderBy(pageReq);

      return Effect.gen(function* () {
        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.agency.count({ where }),
            catch: cause =>
              new AgencyRepositoryError({
                operation: "listWithOffset.count",
                cause,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.agency.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectAgencyRow,
              }),
            catch: cause =>
              new AgencyRepositoryError({
                operation: "listWithOffset.findMany",
                cause,
              }),
          }),
        ]);

        return makePageResult(items.map(toAgencyRow), total, page, pageSize);
      });
    },

    getDetailById(id) {
      return Effect.gen(function* () {
        const agencyRow = yield* Effect.tryPromise({
          try: () =>
            client.agency.findUnique({
              where: { id },
              select: selectAgencyRow,
            }),
          catch: cause =>
            new AgencyRepositoryError({
              operation: "getDetailById.agency",
              cause,
            }),
        });

        if (!agencyRow) {
          return Option.none<AgencyDetailRow>();
        }

        // If no station linked, return agency with null station
        if (!agencyRow.station) {
          return Option.some<AgencyDetailRow>({
            id: agencyRow.id,
            name: agencyRow.name,
            contactPhone: agencyRow.contactPhone,
            status: agencyRow.status,
            station: null,
            createdAt: agencyRow.createdAt,
            updatedAt: agencyRow.updatedAt,
          });
        }

        const stationId = agencyRow.station.id;

        // Fetch full station row
        const stationBaseRow = yield* Effect.tryPromise({
          try: () =>
            client.station.findUnique({
              where: { id: stationId },
              select: stationSelect,
            }),
          catch: cause =>
            new AgencyRepositoryError({
              operation: "getDetailById.station",
              cause,
            }),
        });

        if (!stationBaseRow) {
          return Option.some<AgencyDetailRow>({
            id: agencyRow.id,
            name: agencyRow.name,
            contactPhone: agencyRow.contactPhone,
            status: agencyRow.status,
            station: null,
            createdAt: agencyRow.createdAt,
            updatedAt: agencyRow.updatedAt,
          });
        }

        // Fetch all live counts in parallel
        const [countsMap, returnSlotCountsMap, incomingRedistributionCountsMap] = yield* Effect.all([
          getBikeCounts(client, [stationId]),
          getActiveReturnSlotCounts(client, [stationId]),
          getIncomingRedistributionCounts(client, [stationId]),
        ]);

        const counts = resolveStationCounts({
          countsMap,
          returnSlotCountsMap,
          incomingRedistributionCountsMap,
          stationId,
        });

        const stationRow = applyCounts(stationBaseRow, counts);

        return Option.some<AgencyDetailRow>({
          id: agencyRow.id,
          name: agencyRow.name,
          contactPhone: agencyRow.contactPhone,
          status: agencyRow.status,
          station: {
            id: stationRow.id,
            name: stationRow.name,
            address: stationRow.address,
            stationType: stationRow.stationType,
            totalCapacity: stationRow.totalCapacity,
            returnSlotLimit: stationRow.returnSlotLimit,
            latitude: stationRow.latitude,
            longitude: stationRow.longitude,
            createdAt: stationRow.createdAt,
            updatedAt: stationRow.updatedAt,
            totalBikes: stationRow.totalBikes,
            totalInStationBikes: stationRow.totalInStationBikes,
            availableBikes: stationRow.availableBikes,
            bookedBikes: stationRow.bookedBikes,
            brokenBikes: stationRow.brokenBikes,
            reservedBikes: stationRow.reservedBikes,
            pendingDispatchBikes: stationRow.pendingDispatchBikes,
            transportingBikes: stationRow.transportingBikes,
            swappingBikes: stationRow.swappingBikes,
            lostBikes: stationRow.lostBikes,
            disabledBikes: stationRow.disabledBikes,
            activeReturnSlots: stationRow.activeReturnSlots,
            availableReturnSlots: stationRow.availableReturnSlots,
            emptySlots: stationRow.emptySlots,
            incomingRedistributionBikes: stationRow.incomingRedistributionBikes,
          },
          createdAt: agencyRow.createdAt,
          updatedAt: agencyRow.updatedAt,
        });
      });
    },
  };
}
