import { Context, Effect, Layer } from "effect";

import type {
  PrismaClient,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import type { RatingRepo } from "./rating.repository.types";

import { makeRatingReadRepository } from "./read/rating.read.repository";
import { makeRatingWriteRepository } from "./write/rating.write.repository";

export class RatingRepository extends Context.Tag("RatingRepository")<
  RatingRepository,
  RatingRepo
>() {}

export function makeRatingRepository(client: PrismaClient): RatingRepo {
  return {
    ...makeRatingReadRepository(client),
    ...makeRatingWriteRepository(client),
  };
}

export const RatingRepositoryLive = Layer.effect(
  RatingRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeRatingRepository(client);
  }),
);
