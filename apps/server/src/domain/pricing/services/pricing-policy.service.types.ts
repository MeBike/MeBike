import type { Effect } from "effect";

import type { AccountStatus, Prisma as PrismaTypes } from "generated/prisma/client";

import type {
  ActivePricingPolicyAmbiguous,
  ActivePricingPolicyNotFound,
  PricingPolicyAlreadyUsed,
  PricingPolicyMutationWindowClosed,
  PricingPolicyNotFound,
} from "../domain-errors";
import type { PricingPolicyRow } from "../models";
import type { PricingPolicyUsageSummary } from "../repository/pricing-policy.repository.types";

export type CreatePricingPolicyInput = {
  readonly name: string;
  readonly baseRate: PrismaTypes.Decimal;
  readonly billingUnitMinutes: number;
  readonly reservationFee: PrismaTypes.Decimal;
  readonly depositRequired: PrismaTypes.Decimal;
  readonly lateReturnCutoff: Date;
  readonly now?: Date;
};

export type UpdatePricingPolicyInput = {
  readonly pricingPolicyId: string;
  readonly name?: string;
  readonly baseRate?: PrismaTypes.Decimal;
  readonly billingUnitMinutes?: number;
  readonly reservationFee?: PrismaTypes.Decimal;
  readonly depositRequired?: PrismaTypes.Decimal;
  readonly lateReturnCutoff?: Date;
  readonly now?: Date;
};

export type PricingPolicyQueryService = {
  getById: (
    pricingPolicyId: string,
  ) => Effect.Effect<PricingPolicyRow, PricingPolicyNotFound>;
  getActive: () => Effect.Effect<
    PricingPolicyRow,
    ActivePricingPolicyNotFound | ActivePricingPolicyAmbiguous
  >;
  listPolicies: (
    status?: AccountStatus,
  ) => Effect.Effect<ReadonlyArray<PricingPolicyRow>>;
  getUsageSummary: (
    pricingPolicyId: string,
  ) => Effect.Effect<PricingPolicyUsageSummary>;
};

export type PricingPolicyCommandService = {
  createPolicy: (
    input: CreatePricingPolicyInput,
  ) => Effect.Effect<PricingPolicyRow, PricingPolicyMutationWindowClosed>;
  updatePolicy: (
    input: UpdatePricingPolicyInput,
  ) => Effect.Effect<
    PricingPolicyRow,
    PricingPolicyNotFound | PricingPolicyAlreadyUsed | PricingPolicyMutationWindowClosed
  >;
  activatePolicy: (
    pricingPolicyId: string,
    now?: Date,
  ) => Effect.Effect<
    PricingPolicyRow,
    PricingPolicyNotFound | PricingPolicyMutationWindowClosed
  >;
};
