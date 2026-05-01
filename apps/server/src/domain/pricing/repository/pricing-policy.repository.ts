import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { PricingPolicyRepo } from "./pricing-policy.repository.types";

import { makePricingPolicyReadRepository } from "./read/pricing-policy.read.repository";
import { makePricingPolicyWriteRepository } from "./write/pricing-policy.write.repository";

export type {
  CreatePricingPolicyInput,
  PricingPolicyReadRepo,
  PricingPolicyRepo,
  PricingPolicyWriteRepo,
  UpdatePricingPolicyInput,
  UpdatePricingPolicyStatusInput,
} from "./pricing-policy.repository.types";

/**
 * Facade repository tương thích ngược cho pricing policy.
 *
 * Rental và reservation hiện tại vẫn có thể dùng một factory duy nhất, trong
 * khi bên trong domain pricing đã tách read và write rõ ràng hơn.
 *
 * @param db Prisma client hoặc transaction client hiện tại.
 * @returns Repository gộp đủ cả read và write cho pricing policy.
 */
export function makePricingPolicyRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): PricingPolicyRepo {
  return {
    ...makePricingPolicyReadRepository(db),
    ...makePricingPolicyWriteRepository(db),
  };
}
