import { Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";

import type { PricingPolicyWriteRepo } from "./pricing-policy.repository.types";

import { makePricingPolicyWriteRepository } from "./write/pricing-policy.write.repository";

export type { PricingPolicyWriteRepo } from "./pricing-policy.repository.types";

const makePricingPolicyCommandRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makePricingPolicyCommandRepository(client);
});

export class PricingPolicyCommandRepository extends Effect.Service<PricingPolicyCommandRepository>()(
  "PricingPolicyCommandRepository",
  {
    effect: makePricingPolicyCommandRepositoryEffect,
  },
) {}

export function makePricingPolicyCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): PricingPolicyWriteRepo {
  return makePricingPolicyWriteRepository(client);
}

export const PricingPolicyCommandRepositoryLive = Layer.effect(
  PricingPolicyCommandRepository,
  makePricingPolicyCommandRepositoryEffect.pipe(Effect.map(PricingPolicyCommandRepository.make)),
);
