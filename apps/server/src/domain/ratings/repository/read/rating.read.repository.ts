import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { RatingRepo } from "../rating.repository.types";

import { RatingRepositoryError } from "../../domain-errors";
import { selectRatingRow, toRatingRow } from "../rating.mappers";

export type RatingReadRepo = Pick<
  RatingRepo,
  "findByRentalId" | "findBikeSummary" | "findBikeAggregates" | "findStationSummary"
>;

export function makeRatingReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RatingReadRepo {
  const findSummaryByWhere = (
    where: PrismaTypes.RatingWhereInput,
    scoreField: "bikeScore" | "stationScore",
    operation: string,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const scores = scoreField === "bikeScore"
          ? (await client.rating.findMany({
              where,
              select: { bikeScore: true },
            })).map(row => row.bikeScore)
          : (await client.rating.findMany({
              where,
              select: { stationScore: true },
            })).map(row => row.stationScore);

        const totalRatings = scores.length;
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const groupedCounts = new Map<number, number>();
        for (const score of scores) {
          groupedCounts.set(score, (groupedCounts.get(score) ?? 0) + 1);
        }

        return {
          averageRating: totalRatings === 0 ? 0 : Number((totalScore / totalRatings).toFixed(2)),
          totalRatings,
          breakdown: {
            oneStar: groupedCounts.get(1) ?? 0,
            twoStar: groupedCounts.get(2) ?? 0,
            threeStar: groupedCounts.get(3) ?? 0,
            fourStar: groupedCounts.get(4) ?? 0,
            fiveStar: groupedCounts.get(5) ?? 0,
          },
        };
      },
      catch: err =>
        new RatingRepositoryError({
          operation,
          cause: err,
        }),
    });

  return {
    findByRentalId: rentalId =>
      Effect.tryPromise({
        try: () =>
          client.rating.findUnique({
            where: { rentalId },
            select: selectRatingRow,
          }),
        catch: err =>
          new RatingRepositoryError({
            operation: "findByRentalId",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toRatingRow)),
        ),
      ),

    findBikeSummary: bikeId =>
      findSummaryByWhere(
        { bikeId },
        "bikeScore",
        "findBikeSummary",
      ),

    findBikeAggregates: bikeIds => {
      if (bikeIds.length === 0) {
        return Effect.succeed({});
      }

      return Effect.tryPromise({
        try: async () => {
          const rows = await client.rating.groupBy({
            by: ["bikeId"],
            where: {
              bikeId: { in: [...bikeIds] },
            },
            _avg: {
              bikeScore: true,
            },
            _count: {
              bikeScore: true,
            },
          });

          return Object.fromEntries(
            rows.flatMap(row => {
              if (!row.bikeId) {
                return [];
              }

              return [[
                row.bikeId,
                {
                  averageRating: Number((row._avg.bikeScore ?? 0).toFixed(2)),
                  totalRatings: row._count.bikeScore,
                },
              ]];
            }),
          );
        },
        catch: err =>
          new RatingRepositoryError({
            operation: "findBikeAggregates",
            cause: err,
          }),
      });
    },

    findStationSummary: stationId =>
      findSummaryByWhere(
        { stationId },
        "stationScore",
        "findStationSummary",
      ),
  };
}
