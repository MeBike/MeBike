import type { AccountStatus } from "generated/prisma/client";

export type PricingMoney = bigint;

export type PricingPolicyRow = {
  readonly id: string;
  readonly name: string;
  readonly baseRate: PricingMoney;
  readonly billingUnitMinutes: number;
  readonly reservationFee: PricingMoney;
  readonly depositRequired: PricingMoney;
  readonly lateReturnCutoff: Date;
  readonly status: AccountStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
