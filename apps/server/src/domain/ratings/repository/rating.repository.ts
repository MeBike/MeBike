import { Context, Effect, Layer, Option } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import type { PrismaClient } from "../../../../generated/prisma/client";
import type { CreateRatingInput, RatingRow } from "../models";
import { RatingAlreadyExists, RatingRepositoryError } from "../domain-errors";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
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
};

export class RatingRepository extends Context.Tag("RatingRepository")<
  RatingRepository,
  RatingRepo
>() {}

export function makeRatingRepository(client: PrismaClient): RatingRepo {
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
  };
}

export const RatingRepositoryLive = Layer.effect(
  RatingRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeRatingRepository(client);
  }),
);
