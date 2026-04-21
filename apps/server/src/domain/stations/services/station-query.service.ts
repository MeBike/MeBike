import { Effect, Option } from "effect";

import type { StationRevenueRow, StationRevenueStats } from "../models";
import type { StationQueryRepo } from "../repository/station.repository.types";
import type { StationQueryService } from "./station.service.types";

import { StationNotFound } from "../errors";

/**
 * Tao query-side service cho station domain.
 *
 * @param repo Repository query cua station.
 * @returns StationQueryService chi gom doc du lieu va map query-level rules.
 */
export function makeStationQueryService(repo: StationQueryRepo): StationQueryService {
  const buildRevenueStats = (args: {
    from: Date;
    to: Date;
    rows: readonly StationRevenueRow[];
  }): StationRevenueStats => {
    const stations = [...args.rows].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const totalRevenue = stations.reduce((sum, station) => sum + station.totalRevenue, 0);
    const totalRentals = stations.reduce((sum, station) => sum + station.totalRentals, 0);

    return {
      period: {
        from: args.from,
        to: args.to,
      },
      summary: {
        totalStations: stations.length,
        totalRevenue,
        totalRentals,
        avgRevenuePerStation: stations.length === 0
          ? 0
          : Number((totalRevenue / stations.length).toFixed(2)),
      },
      stations,
    };
  };

  return {
    listStations: (filter, pageReq) =>
      repo.listWithOffset(filter, pageReq),

    getStationById: id =>
      Effect.gen(function* () {
        const maybe = yield* repo.getById(id);
        if (Option.isNone(maybe)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }
        return maybe.value;
      }),

    listContextExcludingId: excludedId =>
      repo.listContextExcludingId(excludedId),

    listNearestStations: args =>
      repo.listNearest(args),

    getRevenueByStation: args =>
      Effect.gen(function* () {
        const rows = yield* repo.getRevenueByStation(args);
        return buildRevenueStats({
          from: args.from,
          to: args.to,
          rows,
        });
      }),

    getRevenueForStation: args =>
      Effect.gen(function* () {
        const stationOpt = yield* repo.getById(args.stationId);
        if (Option.isNone(stationOpt)) {
          return yield* Effect.fail(new StationNotFound({ id: args.stationId }));
        }

        const row = yield* repo.getRevenueForStation(args);
        const fallbackRow: StationRevenueRow = {
          stationId: stationOpt.value.id,
          name: stationOpt.value.name,
          address: stationOpt.value.address,
          totalRentals: 0,
          totalRevenue: 0,
          totalDuration: 0,
          avgDuration: 0,
        };

        return buildRevenueStats({
          from: args.from,
          to: args.to,
          rows: [row ?? fallbackRow],
        });
      }),
  };
}
