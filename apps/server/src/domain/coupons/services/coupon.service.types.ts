import type { Effect } from "effect";

import type {
  ActiveCouponRuleRow,
  AdminCouponStatsRow,
  AdminCouponUsageLogPageResult,
  AdminCouponRulePageResult,
  AdminCouponRuleRow,
  BillingPreviewDiscountRuleRow,
  CreateAdminCouponRuleInput,
  ListAdminCouponUsageLogsFilter,
  ListAdminCouponRulesFilter,
  UpdateAdminCouponRuleInput,
} from "../models";
import type { PageRequest } from "@/domain/shared/pagination";
import type {
  CouponRuleActiveTierConflict,
  CouponRuleAlreadyUsed,
  CouponRuleInvalidActiveWindow,
  CouponRuleInvalidTier,
  CouponRuleNotFound,
} from "../domain-errors";

export type CouponCommandValidationFailure =
  | CouponRuleInvalidTier
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
      readonly ridingDurationMinutes: number;
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
