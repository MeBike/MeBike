import type { AccountStatus, Prisma as PrismaTypes } from "generated/prisma/client";

export type PricingDecimal = PrismaTypes.Decimal;

export type PricingPolicyRow = {
  readonly id: string;
  readonly name: string;
  readonly baseRate: PricingDecimal;
  readonly billingUnitMinutes: number;
  readonly overtimeRate: PricingDecimal | null;
  readonly reservationFee: PricingDecimal;
  readonly depositRequired: PricingDecimal;
  readonly lateReturnCutoff: Date;
  readonly status: AccountStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
