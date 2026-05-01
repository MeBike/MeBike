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

/**
 * Input để tạo mới một draft pricing policy.
 *
 * `now` là optional cho production path, nhưng hữu ích cho test deterministic
 * và cho rule chặn sửa theo khung giờ.
 */
export type CreatePricingPolicyInput = {
  readonly name: string;
  readonly baseRate: PrismaTypes.Decimal;
  readonly billingUnitMinutes: number;
  readonly reservationFee: PrismaTypes.Decimal;
  readonly depositRequired: PrismaTypes.Decimal;
  readonly lateReturnCutoff: Date;
  readonly now?: Date;
};

/**
 * Các field nội dung còn được phép đổi trước lần sử dụng đầu tiên.
 */
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

/**
 * Nhóm use-case đọc cho pricing policy, dùng cho cả màn quản trị lẫn domain
 * phía sau cần xem state hiện tại.
 */
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

/**
 * Nhóm use-case ghi cho pricing policy.
 *
 * Mutation được giữ hẹp có chủ đích: tạo draft, sửa draft chưa dùng, và chuyển
 * policy đang active.
 */
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
