import { Context, Effect, Layer, Option } from "effect";

import type {
  BikeActivityStats,
} from "../../models";
import type { BikeStatsRepo } from "../../repository/bike-stats.repository";
import type { BikeRepo } from "../../repository/bike.repository";
import type { BikeStatsService } from "./bike-stats.service.types";

import { BikeNotFound } from "../../domain-errors";
import { BikeStatsRepository } from "../../repository/bike-stats.repository";
import { BikeRepository } from "../../repository/bike.repository";

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

      getBikeStatistics: () =>
        repo.getBikeStatistics(),

      getBikeStatsById: bikeId =>
        Effect.gen(function* () {
          yield* ensureBikeExists(bikeRepo, bikeId);

          return yield* repo.getBikeStatsById(bikeId);
        }),

      getHighestRevenueBike: () =>
        repo.getHighestRevenueBike(),

      getBikeActivityStats: ({ bikeId, now }) =>
        Effect.gen(function* () {
          yield* ensureBikeExists(bikeRepo, bikeId);

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
          yield* ensureBikeExists(bikeRepo, bikeId);

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
