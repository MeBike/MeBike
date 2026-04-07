import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { BikeCommandRepo } from "./bike.repository.types";

import { makeBikeWriteRepository } from "./write/bike.write.repository";

export type { BikeCommandRepo } from "./bike.repository.types";

const makeBikeCommandRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeBikeCommandRepository(client);
});

export class BikeCommandRepository extends Effect.Service<BikeCommandRepository>()(
  "BikeCommandRepository",
  {
    effect: makeBikeCommandRepositoryEffect,
  },
) {}

export function makeBikeCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): BikeCommandRepo {
  return makeBikeWriteRepository(client);
}

export const BikeCommandRepositoryLive = Layer.effect(
  BikeCommandRepository,
  makeBikeCommandRepositoryEffect.pipe(Effect.map(BikeCommandRepository.make)),
);
