import { Effect, Layer } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { RedistributionRepo } from "./redistribution.repository.types";

import { makeRedistributionReadRepository } from "./read/redistribution.read.repository";
import { makeRedistributionWriteRepository } from "./write/redistribution.write.repository";

export type {
  CreateRedistributionRequestInput,
  RedistributionRepo,
  UpdateRedistributionRequestStatusInput,
} from "./redistribution.repository.types";

export function makeRedistributionRepository(
  db: PrismaClient,
): RedistributionRepo {
  return {
    ...makeRedistributionReadRepository(db),
    ...makeRedistributionWriteRepository(db),
  };
}

const makeRedistributionRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeRedistributionRepository(client);
});

export class RedistributionRepository extends Effect.Service<RedistributionRepository>()(
  "RedistributionRepository",
  {
    effect: makeRedistributionRepositoryEffect,
  },
) {}

export const RedistributionRepositoryLive = Layer.effect(
  RedistributionRepository,
  makeRedistributionRepositoryEffect.pipe(
    Effect.map(RedistributionRepository.make),
  ),
);
