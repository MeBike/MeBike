import { Context, Effect, Layer } from "effect";

import type { ReservationRepositoryError } from "../domain-errors";
import type { ReservationSummaryStats } from "../models";

import { ReservationAnalyticsRepository } from "../repository/reservation-analytics.repository";
import { aggregateReservationStatusCounts } from "./reservation-counts";

export type ReservationStatsService = {
  getSummary: () => Effect.Effect<ReservationSummaryStats, ReservationRepositoryError>;
};

export class ReservationStatsServiceTag extends Context.Tag("ReservationStatsService")<
  ReservationStatsServiceTag,
  ReservationStatsService
>() {}

export const ReservationStatsServiceLive = Layer.effect(
  ReservationStatsServiceTag,
  Effect.gen(function* () {
    const repo = yield* ReservationAnalyticsRepository;

    const service: ReservationStatsService = {
      getSummary: () =>
        Effect.gen(function* () {
          const countsRows = yield* repo.getGlobalReservationCounts();
          const counts = aggregateReservationStatusCounts(countsRows);

          return {
            reservationList: {
              Pending: counts.PENDING,
              Fulfilled: counts.FULFILLED,
              Cancelled: counts.CANCELLED,
              Expired: counts.EXPIRED,
            },
          };
        }),
    };

    return service;
  }),
);
