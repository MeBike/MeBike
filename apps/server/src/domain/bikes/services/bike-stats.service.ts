import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type { BikeRepositoryError } from "../domain-errors";
import type {
  BikeActivityStats,
  BikeRentalHistoryItem,
  BikeRentalHistorySortField,
  BikeRentalStats,
  HighestRevenueBike,
} from "../models";
import type { BikeStatsRepo } from "../repository/bike-stats.repository";
import type { BikeRepo } from "../repository/bike.repository";

import { BikeNotFound } from "../domain-errors";
import {

  BikeStatsRepository,
} from "../repository/bike-stats.repository";
import {

  BikeRepository,
} from "../repository/bike.repository";

export type BikeStatsService = {
  readonly getRentalStats: () => Effect.Effect<
    BikeRentalStats,
    BikeRepositoryError
  >;
  readonly getHighestRevenueBike: () => Effect.Effect<
    HighestRevenueBike | null,
    BikeRepositoryError
  >;
  readonly getBikeActivityStats: (args: {
    bikeId: string;
    now?: Date;
  }) => Effect.Effect<BikeActivityStats, BikeRepositoryError | BikeNotFound>;
  readonly getBikeRentalHistory: (
    bikeId: string,
    pageReq: PageRequest<BikeRentalHistorySortField>,
  ) => Effect.Effect<
    PageResult<BikeRentalHistoryItem>,
    BikeRepositoryError | BikeNotFound
  >;
};

export class BikeStatsServiceTag extends Context.Tag("BikeStatsServiceTag")<
  BikeStatsServiceTag,
  BikeStatsService
>() {}

function ensureBikeExists(
  repo: BikeRepo,
  bikeId: string,
) {
  return repo.getById(bikeId).pipe(
    Effect.flatMap(opt =>
      Option.isSome(opt)
        ? Effect.succeed(opt.value)
        : Effect.fail(new BikeNotFound({ id: bikeId })),
    ),
  );
}

export function makeBikeStatsService(repo: BikeStatsRepo) {
  return Effect.gen(function* () {
    const bikeRepo = yield* BikeRepository;

    const service: BikeStatsService = {
      getRentalStats: () =>
        repo.getRentalStats(),

      getHighestRevenueBike: () =>
        repo.getHighestRevenueBike(),

      getBikeActivityStats: ({ bikeId, now }) =>
        Effect.gen(function* () {
          yield* ensureBikeExists(bikeRepo, bikeId).pipe(
            Effect.catchTag("BikeRepositoryError", err => Effect.fail(err)),
          );

          const runtimeNow = now ?? new Date();
          const stats = yield* repo.getBikeActivityStats({
            bikeId,
            now: runtimeNow,
            months: 12,
          });

          const totalMinutesActive = stats.totalMinutesActive;
          const availableMinutes = stats.minStartTime
            ? Math.max(
                0,
                Math.floor(
                  (runtimeNow.getTime() - stats.minStartTime.getTime())
                  / (60 * 1000),
                ),
              )
            : 0;
          const uptimePercentage
            = availableMinutes === 0
              ? 0
              : (totalMinutesActive / availableMinutes) * 100;

          const activity: BikeActivityStats = {
            bikeId,
            totalMinutesActive,
            totalReports: 0,
            uptimePercentage,
            monthlyStats: stats.monthly.map(row => ({
              year: row.year,
              month: row.month,
              rentalsCount: row.rentalsCount,
              minutesActive: row.minutesActive,
              revenue: row.revenue,
            })),
          };

          return activity;
        }),

      getBikeRentalHistory: (bikeId, pageReq) =>
        Effect.gen(function* () {
          yield* ensureBikeExists(bikeRepo, bikeId).pipe(
            Effect.catchTag("BikeRepositoryError", err => Effect.fail(err)),
          );

          return yield* repo.getBikeRentalHistory(bikeId, pageReq);
        }),
    };

    return service;
  });
}

export const BikeStatsServiceLive = Layer.effect(
  BikeStatsServiceTag,
  Effect.gen(function* () {
    const repo = yield* BikeStatsRepository;
    return yield* makeBikeStatsService(repo);
  }),
);
