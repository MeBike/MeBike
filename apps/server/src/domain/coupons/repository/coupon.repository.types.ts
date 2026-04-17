import type { Effect, Option } from "effect";

import type {
  ActiveCouponRuleRow,
  AdminCouponStatsRow,
  AdminCouponUsageLogPageResult,
  AdminCouponRulePageResult,
  AdminCouponRuleRow,
  BillingPreviewDiscountRuleRow,
  CreateCouponRuleData,
  ListAdminCouponUsageLogsFilter,
  ListAdminCouponRulesFilter,
  UpdateCouponRuleData,
} from "../models";
import type { PageRequest } from "@/domain/shared/pagination";

export type CouponCommandRepo = {
  createAdminCouponRule: (
    data: CreateCouponRuleData,
  ) => Effect.Effect<AdminCouponRuleRow>;
  activateAdminCouponRule: (
    ruleId: string,
  ) => Effect.Effect<Option.Option<AdminCouponRuleRow>>;
  deactivateAdminCouponRule: (
    ruleId: string,
  ) => Effect.Effect<Option.Option<AdminCouponRuleRow>>;
  updateAdminCouponRule: (
    ruleId: string,
    data: UpdateCouponRuleData,
  ) => Effect.Effect<Option.Option<AdminCouponRuleRow>>;
};

export type CouponQueryRepo = {
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
