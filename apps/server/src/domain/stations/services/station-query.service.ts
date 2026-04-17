import { Effect, Option } from "effect";

import type { StationRevenueStats } from "../models";
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
        const stations = [...rows].sort((a, b) => b.totalRevenue - a.totalRevenue);
        const totalRevenue = stations.reduce((sum, station) => sum + station.totalRevenue, 0);
        const totalRentals = stations.reduce((sum, station) => sum + station.totalRentals, 0);

        return {
          period: args,
          summary: {
            totalStations: stations.length,
            totalRevenue,
            totalRentals,
            avgRevenuePerStation: stations.length === 0
              ? 0
              : Number((totalRevenue / stations.length).toFixed(2)),
          },
          stations,
        } satisfies StationRevenueStats;
      }),
  };
}
