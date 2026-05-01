import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { PricingPolicyRow } from "../models";

export const pricingPolicySelect = {
  id: true,
  name: true,
  baseRate: true,
  billingUnitMinutes: true,
  reservationFee: true,
  depositRequired: true,
  lateReturnCutoff: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PricingPolicySelectRow = PrismaTypes.PricingPolicyGetPayload<{
  select: typeof pricingPolicySelect;
}>;

export function toPricingPolicyRow(
  row: PricingPolicySelectRow,
): PricingPolicyRow {
  return row;
}
