import type { Effect } from "effect";

import type { RentalRepositoryError } from "../domain-errors";
import type {
  HourlyRentalStat,
  RentalCountsRow,
  RentalRevenueGroupBy,
  RentalRevenuePoint,
} from "../models";

export type RentalAnalyticsRepo = {
  getRevenueSeries: (
    from: Date,
    to: Date,
    groupBy: RentalRevenueGroupBy,
  ) => Effect.Effect<readonly RentalRevenuePoint[], RentalRepositoryError>;

  getCompletedRevenueTotal: (
    from: Date,
    to: Date,
  ) => Effect.Effect<number, RentalRepositoryError>;

  getCompletedRentalCount: (
    from: Date,
    to: Date,
  ) => Effect.Effect<number, RentalRepositoryError>;

  getRentalStartHourlyStats: (
    from: Date,
    to: Date,
  ) => Effect.Effect<HourlyRentalStat[], RentalRepositoryError>;

  getGlobalRentalCounts: () => Effect.Effect<readonly RentalCountsRow[], RentalRepositoryError>;
};
