import type { Effect, Option } from "effect";

import type { PageRequest } from "@/domain/shared/pagination";

import type { CouponRuleActiveTierConflict } from "../domain-errors";
import type {
  ActiveCouponRuleRow,
  AdminCouponRulePageResult,
  AdminCouponRuleRow,
  AdminCouponStatsRow,
  AdminCouponUsageLogPageResult,
  BillingPreviewDiscountRuleRow,
  CreateCouponRuleData,
  ListAdminCouponRulesFilter,
  ListAdminCouponUsageLogsFilter,
  UpdateCouponRuleData,
} from "../models";

export type CouponCommandRepo = {
  createAdminCouponRule: (
    data: CreateCouponRuleData,
  ) => Effect.Effect<AdminCouponRuleRow, CouponRuleActiveTierConflict>;
  activateAdminCouponRule: (
    ruleId: string,
  ) => Effect.Effect<Option.Option<AdminCouponRuleRow>, CouponRuleActiveTierConflict>;
  deactivateAdminCouponRule: (
    ruleId: string,
  ) => Effect.Effect<Option.Option<AdminCouponRuleRow>>;
  updateAdminCouponRule: (
    ruleId: string,
    data: UpdateCouponRuleData,
  ) => Effect.Effect<Option.Option<AdminCouponRuleRow>, CouponRuleActiveTierConflict>;
  findAdminCouponRule: (
    ruleId: string,
  ) => Effect.Effect<Option.Option<AdminCouponRuleRow>>;
  findActiveRuleWithMinRidingMinutes: (
    minRidingMinutes: number,
    excludeRuleId?: string,
  ) => Effect.Effect<Option.Option<{ readonly id: string }>>;
  hasRentalBillingRecordForRule: (
    ruleId: string,
  ) => Effect.Effect<boolean>;
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
