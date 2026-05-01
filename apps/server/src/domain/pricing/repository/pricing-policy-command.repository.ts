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

/**
 * Effect tag cho persistence phía ghi của pricing policy.
 *
 * Command service dùng tag này khi cần primitive ghi dữ liệu thô mà không phải
 * gắn chặt với chi tiết bootstrap Prisma.
 */
export class PricingPolicyCommandRepository extends Effect.Service<PricingPolicyCommandRepository>()(
  "PricingPolicyCommandRepository",
  {
    effect: makePricingPolicyCommandRepositoryEffect,
  },
) {}

/**
 * Tạo write repository pricing policy từ Prisma client hiện tại.
 *
 * @param client Prisma client hoặc transaction client hiện tại.
 * @returns Write repository cho pricing policy.
 */
export function makePricingPolicyCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): PricingPolicyWriteRepo {
  return makePricingPolicyWriteRepository(client);
}

export const PricingPolicyCommandRepositoryLive = Layer.effect(
  PricingPolicyCommandRepository,
  makePricingPolicyCommandRepositoryEffect.pipe(Effect.map(PricingPolicyCommandRepository.make)),
);
