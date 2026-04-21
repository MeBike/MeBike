import { Context, Effect, Layer, Option } from "effect";

import type {
  StationRevenuePoint,
  StationRevenueRow,
  StationRevenueStats,
} from "../models";

import { StationNotFound } from "../errors";
import { StationAnalyticsRepository } from "../repository/station-analytics.repository";
import { StationQueryRepository } from "../repository/station-query.repository";

export type StationStatsService = {
  /**
   * Tổng hợp doanh thu cho toàn bộ trạm trong một khoảng thời gian.
   * Revenue được ghi nhận theo `endTime` của rental và ownership được gán
   * cho trạm bắt đầu qua `startStationId`.
   */
  getRevenueByStation: (args: {
    from: Date;
    to: Date;
    groupBy?: import("../models").StationRevenueGroupBy;
  }) => Effect.Effect<StationRevenueStats>;

  /**
   * Tổng hợp doanh thu cho một trạm cụ thể trong một khoảng thời gian.
   * Revenue được ghi nhận theo `endTime` của rental và ownership được gán
   * cho trạm bắt đầu qua `startStationId`.
   */
  getRevenueForStation: (args: {
    stationId: string;
    from: Date;
    to: Date;
    groupBy?: import("../models").StationRevenueGroupBy;
  }) => Effect.Effect<StationRevenueStats, StationNotFound>;
};

export class StationStatsServiceTag extends Context.Tag("StationStatsService")<
  StationStatsServiceTag,
  StationStatsService
>() {}

function buildRevenueStats(args: {
  from: Date;
  to: Date;
  rows: readonly StationRevenueRow[];
  series?: readonly StationRevenuePoint[];
  groupBy?: StationRevenueStats["groupBy"];
}): StationRevenueStats {
  const stations = [...args.rows].sort((left, right) => right.totalRevenue - left.totalRevenue);
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
    ...(args.groupBy ? { groupBy: args.groupBy } : {}),
    ...(args.series ? { series: args.series } : {}),
  };
}

export const StationStatsServiceLive = Layer.effect(
  StationStatsServiceTag,
  Effect.gen(function* () {
    const analyticsRepo = yield* StationAnalyticsRepository;
    const queryRepo = yield* StationQueryRepository;

    const service: StationStatsService = {
      getRevenueByStation: args =>
        Effect.gen(function* () {
          const [rows, series] = yield* Effect.all([
            analyticsRepo.getRevenueByStation(args),
            args.groupBy
              ? analyticsRepo.getRevenueSeries({
                  from: args.from,
                  to: args.to,
                  groupBy: args.groupBy,
                })
              : Effect.succeed(undefined),
          ]);

          return buildRevenueStats({
            from: args.from,
            to: args.to,
            rows,
            groupBy: args.groupBy,
            series,
          });
        }),

      getRevenueForStation: args =>
        Effect.gen(function* () {
          const stationOpt = yield* queryRepo.getById(args.stationId);
          if (Option.isNone(stationOpt)) {
            return yield* Effect.fail(new StationNotFound({ id: args.stationId }));
          }

          const [aggregate, series] = yield* Effect.all([
            analyticsRepo.getRevenueForStation(args),
            args.groupBy
              ? analyticsRepo.getRevenueSeries({
                  stationId: args.stationId,
                  from: args.from,
                  to: args.to,
                  groupBy: args.groupBy,
                })
              : Effect.succeed(undefined),
          ]);

          return buildRevenueStats({
            from: args.from,
            to: args.to,
            rows: [{
              stationId: stationOpt.value.id,
              name: stationOpt.value.name,
              address: stationOpt.value.address,
              totalRentals: aggregate?.totalRentals ?? 0,
              totalRevenue: aggregate?.totalRevenue ?? 0,
              totalDuration: aggregate?.totalDuration ?? 0,
              avgDuration: aggregate?.avgDuration ?? 0,
            }],
            groupBy: args.groupBy,
            series,
          });
        }),
    };

    return service;
  }),
);
