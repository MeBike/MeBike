import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { BikeQueryRepo } from "./bike.repository.types";

import { makeBikeReadRepository } from "./read/bike.read.repository";

export type { BikeQueryRepo } from "./bike.repository.types";

const makeBikeQueryRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeBikeQueryRepository(client);
});

export class BikeQueryRepository extends Effect.Service<BikeQueryRepository>()(
  "BikeQueryRepository",
  {
    effect: makeBikeQueryRepositoryEffect,
  },
) {}

export function makeBikeQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): BikeQueryRepo {
  return makeBikeReadRepository(client);
}

export const BikeQueryRepositoryLive = Layer.effect(
  BikeQueryRepository,
  makeBikeQueryRepositoryEffect.pipe(Effect.map(BikeQueryRepository.make)),
);
