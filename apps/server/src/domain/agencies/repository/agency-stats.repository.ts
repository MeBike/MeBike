import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import {
  BikeStatus,
  IncidentSeverity,
  IncidentStatus,
  RentalStatus,
  UserRole,
} from "generated/prisma/client";

import type {
  AgencyCurrentStationStats,
  AgencyIncidentStats,
  AgencyOperatorStats,
  AgencyPickupStats,
  AgencyReturnStats,
  AgencyStatsPeriod,
} from "../models";

import { AgencyRepositoryError } from "../domain-errors";

export type AgencyOperationalMetrics = {
  readonly operators: AgencyOperatorStats;
  readonly currentStation: AgencyCurrentStationStats;
  readonly pickups: AgencyPickupStats;
  readonly returns: AgencyReturnStats;
  readonly incidents: AgencyIncidentStats;
};

export type AgencyStatsRepo = {
  readonly getOperatorStats: (agencyId: string) => Effect.Effect<
    AgencyOperatorStats,
    AgencyRepositoryError
  >;
  readonly getOperationalMetrics: (args: {
    agencyId: string;
    stationId: string;
    totalCapacity: number;
    returnSlotLimit: number;
    period: AgencyStatsPeriod;
  }) => Effect.Effect<AgencyOperationalMetrics, AgencyRepositoryError>;
};

function toCountMap<T extends string>(
  rows: ReadonlyArray<{
    status: T;
    _count?:
      | true
      | {
        _all?: number | null;
      }
      | null;
  }>,
) {
  return new Map(
    rows.map(row => [
      row.status,
      row._count && row._count !== true
        ? Number(row._count._all ?? 0)
        : 0,
    ] as const),
  );
}

export function makeAgencyStatsRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): AgencyStatsRepo {
  const withOp = <A>(operation: string, run: () => Promise<A>) =>
    Effect.tryPromise({
      try: run,
      catch: cause => new AgencyRepositoryError({ operation, cause }),
    });

  const getOperatorStats = (agencyId: string) =>
    Effect.gen(function* () {
      const [totalOperators, activeOperators] = yield* Effect.all([
        withOp("getOperatorStats.totalOperators", () =>
          client.userOrgAssignment.count({
            where: {
              agencyId,
              user: {
                role: UserRole.AGENCY,
              },
            },
          })),
        withOp("getOperatorStats.activeOperators", () =>
          client.userOrgAssignment.count({
            where: {
              agencyId,
              user: {
                role: UserRole.AGENCY,
                accountStatus: "ACTIVE",
              },
            },
          })),
      ]);

      return {
        totalOperators,
        activeOperators,
      };
    });

  return {
    getOperatorStats,

    getOperationalMetrics(args) {
      const {
        agencyId,
        stationId,
        totalCapacity,
        returnSlotLimit,
        period,
      } = args;

      return Effect.gen(function* () {
        const [
          operators,
          bikeStatusRows,
          pickupStatusRows,
          pickupCompletedAggregate,
          totalReturns,
          agencyConfirmedReturns,
          totalIncidentsInPeriod,
          openIncidents,
          resolvedIncidentsInPeriod,
          criticalOpenIncidents,
        ] = yield* Effect.all([
          getOperatorStats(agencyId),
          withOp("getOperationalMetrics.bikeStatuses", () =>
            client.bike.groupBy({
              by: ["status"],
              where: { stationId },
              _count: { _all: true },
            })),
          withOp("getOperationalMetrics.pickupStatuses", () =>
            client.rental.groupBy({
              by: ["status"],
              where: {
                startStationId: stationId,
                startTime: {
                  gte: period.from,
                  lte: period.to,
                },
              },
              _count: { _all: true },
            })),
          withOp("getOperationalMetrics.pickupCompletedAggregate", () =>
            client.rental.aggregate({
              where: {
                startStationId: stationId,
                status: RentalStatus.COMPLETED,
                startTime: {
                  gte: period.from,
                  lte: period.to,
                },
              },
              _sum: {
                totalPrice: true,
              },
              _avg: {
                duration: true,
              },
            })),
          withOp("getOperationalMetrics.totalReturns", () =>
            client.rental.count({
              where: {
                endStationId: stationId,
                status: RentalStatus.COMPLETED,
                endTime: {
                  gte: period.from,
                  lte: period.to,
                },
              },
            })),
          withOp("getOperationalMetrics.agencyConfirmedReturns", () =>
            client.returnConfirmation.count({
              where: {
                stationId,
                confirmedAt: {
                  gte: period.from,
                  lte: period.to,
                },
                confirmedByUser: {
                  orgAssignment: {
                    is: {
                      agencyId,
                    },
                  },
                },
              },
            })),
          withOp("getOperationalMetrics.totalIncidentsInPeriod", () =>
            client.incidentReport.count({
              where: {
                stationId,
                reportedAt: {
                  gte: period.from,
                  lte: period.to,
                },
              },
            })),
          withOp("getOperationalMetrics.openIncidents", () =>
            client.incidentReport.count({
              where: {
                stationId,
                status: {
                  in: [
                    IncidentStatus.OPEN,
                    IncidentStatus.ASSIGNED,
                    IncidentStatus.IN_PROGRESS,
                  ],
                },
              },
            })),
          withOp("getOperationalMetrics.resolvedIncidentsInPeriod", () =>
            client.incidentReport.count({
              where: {
                stationId,
                resolvedAt: {
                  gte: period.from,
                  lte: period.to,
                },
              },
            })),
          withOp("getOperationalMetrics.criticalOpenIncidents", () =>
            client.incidentReport.count({
              where: {
                stationId,
                severity: IncidentSeverity.CRITICAL,
                status: {
                  in: [
                    IncidentStatus.OPEN,
                    IncidentStatus.ASSIGNED,
                    IncidentStatus.IN_PROGRESS,
                  ],
                },
              },
            })),
        ]);

        const bikeCounts = toCountMap(bikeStatusRows);
        const totalBikes = Array.from(bikeCounts.values()).reduce(
          (sum, count) => sum + count,
          0,
        );
        const emptySlots = Math.max(0, totalCapacity - totalBikes);
        const occupancyRate = totalCapacity === 0
          ? 0
          : Number(((totalBikes / totalCapacity) * 100).toFixed(2));

        const pickupCounts = toCountMap(pickupStatusRows);
        const totalRentals = Array.from(pickupCounts.values()).reduce(
          (sum, count) => sum + count,
          0,
        );

        return {
          operators,
          currentStation: {
            totalCapacity,
            returnSlotLimit,
            totalBikes,
            availableBikes: bikeCounts.get(BikeStatus.AVAILABLE) ?? 0,
            bookedBikes: bikeCounts.get(BikeStatus.BOOKED) ?? 0,
            brokenBikes: bikeCounts.get(BikeStatus.BROKEN) ?? 0,
            reservedBikes: bikeCounts.get(BikeStatus.RESERVED) ?? 0,
            maintainedBikes: bikeCounts.get(BikeStatus.MAINTAINED) ?? 0,
            unavailableBikes: bikeCounts.get(BikeStatus.UNAVAILABLE) ?? 0,
            emptySlots,
            occupancyRate,
          },
          pickups: {
            totalRentals,
            activeRentals: pickupCounts.get(RentalStatus.RENTED) ?? 0,
            completedRentals: pickupCounts.get(RentalStatus.COMPLETED) ?? 0,
            cancelledRentals: pickupCounts.get(RentalStatus.CANCELLED) ?? 0,
            totalRevenue: Number(pickupCompletedAggregate._sum.totalPrice ?? 0),
            avgDurationMinutes: Number(
              pickupCompletedAggregate._avg.duration?.toFixed(2) ?? 0,
            ),
          },
          returns: {
            totalReturns,
            agencyConfirmedReturns,
          },
          incidents: {
            totalIncidentsInPeriod,
            openIncidents,
            resolvedIncidentsInPeriod,
            criticalOpenIncidents,
          },
        } satisfies AgencyOperationalMetrics;
      });
    },
  };
}

const makeAgencyStatsRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeAgencyStatsRepository(client);
});

export class AgencyStatsRepository extends Effect.Service<AgencyStatsRepository>()(
  "AgencyStatsRepository",
  {
    effect: makeAgencyStatsRepositoryEffect,
  },
) {}

export const AgencyStatsRepositoryLive = Layer.effect(
  AgencyStatsRepository,
  makeAgencyStatsRepositoryEffect.pipe(Effect.map(AgencyStatsRepository.make)),
);
