import { Context, Effect, Layer, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type {
  CreateRatingInput,
  RatingAggregate,
  RatingRow,
  RatingSummary,
} from "../models";

import { RatingAlreadyExists, RatingRepositoryError } from "../domain-errors";
import { selectRatingRow, toRatingRow } from "./rating.mappers";

export type RatingRepo = {
  readonly createRating: (
    input: CreateRatingInput,
  ) => Effect.Effect<RatingRow, RatingRepositoryError | RatingAlreadyExists>;
  readonly findByRentalId: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<RatingRow>, RatingRepositoryError>;
  readonly findBikeSummary: (
    bikeId: string,
  ) => Effect.Effect<RatingSummary, RatingRepositoryError>;
  readonly findBikeAggregates: (
    bikeIds: readonly string[],
  ) => Effect.Effect<Record<string, RatingAggregate>, RatingRepositoryError>;
  readonly findStationSummary: (
    stationId: string,
  ) => Effect.Effect<RatingSummary, RatingRepositoryError>;
};

export class RatingRepository extends Context.Tag("RatingRepository")<
  RatingRepository,
  RatingRepo
>() {}

export function makeRatingRepository(client: PrismaClient): RatingRepo {
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
        } satisfies RatingSummary;
      },
      catch: err =>
        new RatingRepositoryError({
          operation,
          cause: err,
        }),
    });

  return {
    createRating: input =>
      Effect.tryPromise({
        try: () =>
          client.$transaction(async (tx) => {
            const reasons = await tx.ratingReason.findMany({
              where: { id: { in: input.reasonIds as string[] } },
              select: { id: true, appliesTo: true },
            });

            return tx.rating.create({
              data: {
                userId: input.userId,
                rentalId: input.rentalId,
                bikeId: input.bikeId ?? null,
                stationId: input.stationId ?? null,
                bikeScore: input.bikeScore,
                stationScore: input.stationScore,
                comment: input.comment ?? null,
                reasons: {
                  createMany: {
                    data: reasons.map(reason => ({
                      reasonId: reason.id,
                      target: reason.appliesTo,
                    })),
                  },
                },
              },
              select: selectRatingRow,
            });
          }),
        catch: (err) => {
          if (isPrismaUniqueViolation(err)) {
            // rentalId is unique -> one rating per rental
            return new RatingAlreadyExists({ rentalId: input.rentalId });
          }
          return new RatingRepositoryError({
            operation: "createRating",
            cause: err,
          });
        },
      }).pipe(Effect.map(toRatingRow)),

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
        {
          bikeId,
        },
        "bikeScore",
        "findBikeSummary",
      ),

    findBikeAggregates: (bikeIds) => {
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
            rows.flatMap((row) => {
              if (!row.bikeId) {
                return [];
              }

              return [[
                row.bikeId,
                {
                  averageRating: Number(((row._avg.bikeScore ?? 0)).toFixed(2)),
                  totalRatings: row._count.bikeScore,
                } satisfies RatingAggregate,
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
        {
          stationId,
        },
        "stationScore",
        "findStationSummary",
      ),
  };
}

export const RatingRepositoryLive = Layer.effect(
  RatingRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeRatingRepository(client);
  }),
);
