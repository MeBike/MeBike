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

/**
 * Effect tag cho persistence phía đọc của pricing policy.
 *
 * Các feature layer có thể lấy tag này thay vì tự dựng repo trực tiếp từ
 * Prisma client.
 */
export class PricingPolicyQueryRepository extends Effect.Service<PricingPolicyQueryRepository>()(
  "PricingPolicyQueryRepository",
  {
    effect: makePricingPolicyQueryRepositoryEffect,
  },
) {}

/**
 * Tạo read repository pricing policy từ Prisma client hiện tại.
 *
 * @param client Prisma client hoặc transaction client hiện tại.
 * @returns Read repository cho pricing policy.
 */
export function makePricingPolicyQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): PricingPolicyReadRepo {
  return makePricingPolicyReadRepository(client);
}

export const PricingPolicyQueryRepositoryLive = Layer.effect(
  PricingPolicyQueryRepository,
  makePricingPolicyQueryRepositoryEffect.pipe(Effect.map(PricingPolicyQueryRepository.make)),
);
