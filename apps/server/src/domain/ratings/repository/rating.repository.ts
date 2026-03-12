import { Context, Effect, Layer, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { CreateRatingInput, RatingRow, RatingSummary } from "../models";

import { RatingAlreadyExists, RatingRepositoryError } from "../domain-errors";
import { selectRatingRow, toRatingRow } from "./rating.mappers";

export type RatingRepo = {
  readonly createRating: (
    input: CreateRatingInput,
  ) => Effect.Effect<
    RatingRow,
    RatingRepositoryError | RatingAlreadyExists
  >;
  readonly findByRentalId: (
    rentalId: string,
  ) => Effect.Effect<
    Option.Option<RatingRow>,
    RatingRepositoryError
  >;
  readonly findBikeSummary: (
    bikeId: string,
  ) => Effect.Effect<RatingSummary, RatingRepositoryError>;
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
    operation: string,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const [aggregate, grouped] = await Promise.all([
          client.rating.aggregate({
            where,
            _avg: {
              rating: true,
            },
            _count: {
              _all: true,
            },
          }),
          client.rating.groupBy({
            by: ["rating"],
            where,
            _count: {
              _all: true,
            },
          }),
        ]);

        const groupedCounts = new Map(
          grouped.map(row => [row.rating, row._count._all]),
        );

        return {
          averageRating: Number(aggregate._avg.rating ?? 0),
          totalRatings: aggregate._count._all,
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
          client.rating.create({
            data: {
              userId: input.userId,
              rentalId: input.rentalId,
              rating: input.rating,
              comment: input.comment ?? null,
              reasons: {
                createMany: {
                  data: input.reasonIds.map(id => ({
                    reasonId: id,
                  })),
                },
              },
            },
            select: selectRatingRow,
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
          rental: {
            bikeId,
          },
        },
        "findBikeSummary",
      ),

    findStationSummary: stationId =>
      findSummaryByWhere(
        {
          rental: {
            startStationId: stationId,
          },
        },
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
