import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type {
  AccountStatus,
} from "generated/prisma/client";

import type {
  ActivePricingPolicyAmbiguous,
  ActivePricingPolicyNotFound,
  PricingPolicyNotFound,
} from "../domain-errors";
import type { PricingPolicyRow } from "../models";

export type CreatePricingPolicyInput = {
  readonly id?: string;
  readonly name: string;
  readonly baseRate: bigint;
  readonly billingUnitMinutes: number;
  readonly reservationFee: bigint;
  readonly depositRequired: bigint;
  readonly lateReturnCutoff: Date;
  readonly status?: AccountStatus;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
};

export type UpdatePricingPolicyInput = {
  readonly pricingPolicyId: string;
  readonly name?: string;
  readonly baseRate?: bigint;
  readonly billingUnitMinutes?: number;
  readonly reservationFee?: bigint;
  readonly depositRequired?: bigint;
  readonly lateReturnCutoff?: Date;
  readonly status?: AccountStatus;
  readonly updatedAt?: Date;
};

export type UpdatePricingPolicyStatusInput = {
  readonly pricingPolicyId: string;
  readonly status: AccountStatus;
  readonly updatedAt?: Date;
};

export type PricingPolicyUsageSummary = {
  readonly reservationCount: number;
  readonly rentalCount: number;
  readonly billingRecordCount: number;
  readonly isUsed: boolean;
};

export type PricingPolicyReadRepo = {
  findById: (
    pricingPolicyId: string,
  ) => Effect.Effect<Option.Option<PricingPolicyRow>>;
  getById: (
    pricingPolicyId: string,
  ) => Effect.Effect<PricingPolicyRow, PricingPolicyNotFound>;
  getActive: () => Effect.Effect<
    PricingPolicyRow,
    ActivePricingPolicyNotFound | ActivePricingPolicyAmbiguous
  >;
  listByStatus: (
    status?: AccountStatus,
    pageReq?: PageRequest,
  ) => Effect.Effect<PageResult<PricingPolicyRow>>;
  getUsageSummary: (
    pricingPolicyId: string,
  ) => Effect.Effect<PricingPolicyUsageSummary>;
};

export type PricingPolicyWriteRepo = {
  createPricingPolicy: (
    input: CreatePricingPolicyInput,
  ) => Effect.Effect<PricingPolicyRow>;
  updatePricingPolicy: (
    input: UpdatePricingPolicyInput,
  ) => Effect.Effect<Option.Option<PricingPolicyRow>>;
  updatePricingPolicyStatus: (
    input: UpdatePricingPolicyStatusInput,
  ) => Effect.Effect<Option.Option<PricingPolicyRow>>;
  deactivateActivePolicies: (
    args?: {
      readonly excludePricingPolicyId?: string;
      readonly updatedAt?: Date;
    },
  ) => Effect.Effect<number>;
};

export type PricingPolicyRepo = PricingPolicyReadRepo & PricingPolicyWriteRepo;
