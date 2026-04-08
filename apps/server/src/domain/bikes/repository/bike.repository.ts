import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { BikeRepo } from "./bike.repository.types";

import { makeBikeCommandRepository } from "./bike-command.repository";
import { makeBikeQueryRepository } from "./bike-query.repository";

export type {
  BikeCommandRepo,
  BikeCreateInput,
  BikeQueryRepo,
  BikeRepo,
  BikeUpdatePatch,
} from "./bike.repository.types";

const makeBikeRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeBikeRepository(client);
});

export class BikeRepository extends Effect.Service<BikeRepository>()(
  "BikeRepository",
  {
    effect: makeBikeRepositoryEffect,
  },
) {}

export function makeBikeRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): BikeRepo {
  return {
    ...makeBikeQueryRepository(client),
    ...makeBikeCommandRepository(client),
  };
}

export const bikeRepositoryFactory = makeBikeRepository;

export const BikeRepositoryLive = Layer.effect(
  BikeRepository,
  makeBikeRepositoryEffect.pipe(Effect.map(BikeRepository.make)),
);
