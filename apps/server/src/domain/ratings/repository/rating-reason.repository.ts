import { Context, Effect, Layer } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import type { PrismaClient } from "../../../../generated/prisma/client";
import type { RatingReasonRow } from "../models";
import { RatingRepositoryError } from "../domain-errors";

export type RatingReasonRepo = {
  readonly findManyByIds: (
    ids: readonly string[],
  ) => Effect.Effect<readonly RatingReasonRow[], RatingRepositoryError>;
};

export class RatingReasonRepository extends Context.Tag("RatingReasonRepository")<
  RatingReasonRepository,
  RatingReasonRepo
>() {}

export function makeRatingReasonRepository(client: PrismaClient): RatingReasonRepo {
  return {
    findManyByIds: ids =>
      Effect.tryPromise({
        try: () =>
          client.ratingReason.findMany({
            where: { id: { in: ids as string[] } },
            select: {
              id: true,
              type: true,
              appliesTo: true,
              messages: true,
            },
          }),
        catch: err =>
          new RatingRepositoryError({
            operation: "ratingReason.findManyByIds",
            cause: err,
          }),
      }),
  };
}

export const RatingReasonRepositoryLive = Layer.effect(
  RatingReasonRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeRatingReasonRepository(client);
  }),
);
