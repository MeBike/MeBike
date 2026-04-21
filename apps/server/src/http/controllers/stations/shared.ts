import { StationsContracts } from "@mebike/shared";

import { previousUtcMonthFullRange } from "@/domain/rentals/services/queries/rental-stats-time";

export type StationsRoutes = typeof import("@mebike/shared")["serverRoutes"]["stations"];

export const { StationErrorCodeSchema, stationErrorMessages } = StationsContracts;

export type StationSummary = StationsContracts.StationSummary;
export type StationReadSummary = StationsContracts.StationReadSummary;
export type StationErrorResponse = StationsContracts.StationErrorResponse;
export type StationListResponse = StationsContracts.StationListResponse;
export type StationRevenueResponse = StationsContracts.StationRevenueResponse;

type StationRevenueQueryInput = {
  from?: string;
  to?: string;
};

export function resolveStationRevenueRange(
  query: StationRevenueQueryInput,
  now = new Date(),
):
  | { ok: true; range: { from: Date; to: Date } }
  | { ok: false; error: StationErrorResponse } {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;

  if ((from && !to) || (!from && to) || (from && to && from > to)) {
    return {
      ok: false,
      error: {
        error: stationErrorMessages.INVALID_DATE_RANGE,
        details: {
          code: StationErrorCodeSchema.enum.INVALID_DATE_RANGE,
          from: query.from,
          to: query.to,
        },
      },
    };
  }

  return {
    ok: true,
    range: from && to ? { from, to } : previousUtcMonthFullRange(now),
  };
}
