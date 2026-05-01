import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { PricingPolicyReadRepo } from "./pricing-policy.repository.types";

import { makePricingPolicyReadRepository } from "./read/pricing-policy.read.repository";

export type { PricingPolicyReadRepo } from "./pricing-policy.repository.types";

const makePricingPolicyQueryRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makePricingPolicyQueryRepository(client);
});

export class PricingPolicyQueryRepository extends Effect.Service<PricingPolicyQueryRepository>()(
  "PricingPolicyQueryRepository",
  {
    effect: makePricingPolicyQueryRepositoryEffect,
  },
) {}

export function makePricingPolicyQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): PricingPolicyReadRepo {
  return makePricingPolicyReadRepository(client);
}

export const PricingPolicyQueryRepositoryLive = Layer.effect(
  PricingPolicyQueryRepository,
  makePricingPolicyQueryRepositoryEffect.pipe(Effect.map(PricingPolicyQueryRepository.make)),
);
