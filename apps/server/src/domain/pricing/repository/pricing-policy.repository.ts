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

export function makePricingPolicyRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): PricingPolicyRepo {
  return {
    ...makePricingPolicyReadRepository(db),
    ...makePricingPolicyWriteRepository(db),
  };
}
