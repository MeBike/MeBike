import { Effect, Layer, Option } from "effect";

import type {
  AgencyOperationalStats,
  AgencyStatsPeriod,
} from "../models";
import type { AgencyStatsRepo } from "../repository/agency-stats.repository";
import type { AgencyRepo } from "../repository/agency.repository";

import { AgencyNotFound } from "../domain-errors";
import {
  AgencyStatsRepository,
} from "../repository/agency-stats.repository";
import { AgencyRepository } from "../repository/agency.repository";

type AgencyStatsInput = {
  readonly from?: Date;
  readonly to?: Date;
};

export type AgencyStatsService = {
  readonly getAgencyOperationalStats: (
    agencyId: string,
    input: AgencyStatsInput,
  ) => Effect.Effect<AgencyOperationalStats, AgencyNotFound>;
};

function defaultPeriod(now: Date): AgencyStatsPeriod {
  return {
    from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    to: now,
  };
}

function resolvePeriod(input: AgencyStatsInput): AgencyStatsPeriod {
  if (input.from && input.to) {
    return {
      from: input.from,
      to: input.to,
    };
  }

  return defaultPeriod(new Date());
}

function emptyMetrics(totalCapacity: number, returnSlotLimit: number) {
  return {
    operators: {
      totalOperators: 0,
      activeOperators: 0,
    },
    currentStation: {
      totalCapacity,
      returnSlotLimit,
      totalBikes: 0,
      availableBikes: 0,
      bookedBikes: 0,
      brokenBikes: 0,
      reservedBikes: 0,
      redistributingBikes: 0,
      lostBikes: 0,
      disabledBikes: 0,
      emptySlots: totalCapacity,
      occupancyRate: 0,
    },
    pickups: {
      totalRentals: 0,
      activeRentals: 0,
      completedRentals: 0,
      totalRevenue: 0,
      avgDurationMinutes: 0,
    },
    returns: {
      totalReturns: 0,
      agencyConfirmedReturns: 0,
    },
    incidents: {
      totalIncidentsInPeriod: 0,
      openIncidents: 0,
      resolvedIncidentsInPeriod: 0,
      criticalOpenIncidents: 0,
    },
  } as const;
}

export function makeAgencyStatsService(
  repo: Pick<AgencyRepo, "getById">,
  statsRepo: AgencyStatsRepo,
): AgencyStatsService {
  return {
    getAgencyOperationalStats: (agencyId, input) =>
      Effect.gen(function* () {
        const agencyOpt = yield* repo.getById(agencyId).pipe(
          Effect.catchTag("AgencyRepositoryError", error =>
            Effect.die(error)),
        );

        if (Option.isNone(agencyOpt)) {
          return yield* Effect.fail(new AgencyNotFound({ id: agencyId }));
        }

        const agency = agencyOpt.value;
        const period = resolvePeriod(input);
        const operators = yield* statsRepo.getOperatorStats(agencyId).pipe(
          Effect.catchTag("AgencyRepositoryError", error =>
            Effect.die(error)),
        );

        if (!agency.station) {
          return {
            agency,
            period,
            ...emptyMetrics(0, 0),
            operators,
          };
        }

        const metrics = yield* statsRepo.getOperationalMetrics({
          agencyId,
          stationId: agency.station.id,
          totalCapacity: agency.station.totalCapacity ?? 0,
          returnSlotLimit: agency.station.returnSlotLimit ?? agency.station.totalCapacity ?? 0,
          period,
        }).pipe(
          Effect.catchTag("AgencyRepositoryError", error =>
            Effect.die(error)),
        );

        return {
          agency,
          period,
          ...metrics,
        };
      }),
  };
}

const makeAgencyStatsServiceEffect = Effect.gen(function* () {
  const repo = yield* AgencyRepository;
  const statsRepo = yield* AgencyStatsRepository;
  return makeAgencyStatsService(repo, statsRepo);
});

export class AgencyStatsServiceTag extends Effect.Service<AgencyStatsServiceTag>()(
  "AgencyStatsService",
  {
    effect: makeAgencyStatsServiceEffect,
  },
) {}

export const AgencyStatsServiceLive = Layer.effect(
  AgencyStatsServiceTag,
  makeAgencyStatsServiceEffect.pipe(Effect.map(AgencyStatsServiceTag.make)),
);
