import type { Effect } from "effect";

import type {
  StationRevenueAggregate,
  StationRevenueGroupBy,
  StationRevenuePoint,
  StationRevenueRow,
} from "../models";

export type StationAnalyticsRepo = {
  getRevenueByStation: (args: {
    from: Date;
    to: Date;
  }) => Effect.Effect<readonly StationRevenueRow[]>;
  getRevenueForStation: (args: {
    stationId: string;
    from: Date;
    to: Date;
  }) => Effect.Effect<StationRevenueAggregate | null>;
  getRevenueSeries: (args: {
    from: Date;
    to: Date;
    groupBy: StationRevenueGroupBy;
    stationId?: string;
  }) => Effect.Effect<readonly StationRevenuePoint[]>;
};
