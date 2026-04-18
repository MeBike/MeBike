import type { Effect } from "effect";

import type { PageRequest } from "@/domain/shared/pagination";

import type {
  CouponRuleActiveTierConflict,
  CouponRuleAlreadyUsed,
  CouponRuleInvalidActiveWindow,
  CouponRuleInvalidTier,
  CouponRuleNotFound,
} from "../domain-errors";
import type {
  ActiveCouponRuleRow,
  AdminCouponRulePageResult,
  AdminCouponRuleRow,
  AdminCouponStatsRow,
  AdminCouponUsageLogPageResult,
  BillingPreviewDiscountRuleRow,
  CreateAdminCouponRuleInput,
  ListAdminCouponRulesFilter,
  ListAdminCouponUsageLogsFilter,
  UpdateAdminCouponRuleInput,
} from "../models";

export type CouponCommandValidationFailure
  = | CouponRuleInvalidTier
  | CouponRuleInvalidActiveWindow
  | CouponRuleActiveTierConflict
  | CouponRuleAlreadyUsed;

export type CouponCommandService = {
  createAdminCouponRule: (
    input: CreateAdminCouponRuleInput,
  ) => Effect.Effect<AdminCouponRuleRow, CouponCommandValidationFailure>;
  activateAdminCouponRule: (
    ruleId: string,
  ) => Effect.Effect<
    AdminCouponRuleRow,
    | CouponRuleNotFound
    | CouponRuleInvalidTier
    | CouponRuleInvalidActiveWindow
    | CouponRuleActiveTierConflict
  >;
  deactivateAdminCouponRule: (
    ruleId: string,
  ) => Effect.Effect<AdminCouponRuleRow, CouponRuleNotFound>;
  updateAdminCouponRule: (
    ruleId: string,
    input: UpdateAdminCouponRuleInput,
  ) => Effect.Effect<
    AdminCouponRuleRow,
    CouponRuleNotFound | CouponCommandValidationFailure
  >;
};

export type CouponQueryService = {
  listGlobalBillingPreviewDiscountRules: (
    input: {
      readonly previewedAt: Date;
      readonly billableMinutes: number;
    },
  ) => Effect.Effect<readonly BillingPreviewDiscountRuleRow[]>;
  listActiveGlobalCouponRules: (
    input: {
      readonly now: Date;
    },
  ) => Effect.Effect<readonly ActiveCouponRuleRow[]>;
  listAdminCouponRules: (
    filter: ListAdminCouponRulesFilter,
    pageReq: PageRequest,
  ) => Effect.Effect<AdminCouponRulePageResult>;
  getAdminCouponStats: (
    input: {
      readonly from?: Date;
      readonly to?: Date;
    },
  ) => Effect.Effect<AdminCouponStatsRow>;
  listAdminCouponUsageLogs: (
    filter: ListAdminCouponUsageLogsFilter,
    pageReq: PageRequest,
  ) => Effect.Effect<AdminCouponUsageLogPageResult>;
};

export type CouponService = CouponCommandService & CouponQueryService;
