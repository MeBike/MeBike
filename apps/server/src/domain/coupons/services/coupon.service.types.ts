import type { Effect } from "effect";

import type {
  ActiveCouponRuleRow,
  AdminCouponRulePageResult,
  AdminCouponRuleRow,
  BillingPreviewDiscountRuleRow,
  CreateAdminCouponRuleInput,
  ListAdminCouponRulesFilter,
  UpdateAdminCouponRuleInput,
} from "../models";
import type { PageRequest } from "@/domain/shared/pagination";
import type { CouponRuleNotFound } from "../domain-errors";

export type CouponCommandService = {
  createAdminCouponRule: (
    input: CreateAdminCouponRuleInput,
  ) => Effect.Effect<AdminCouponRuleRow>;
  activateAdminCouponRule: (
    ruleId: string,
  ) => Effect.Effect<AdminCouponRuleRow, CouponRuleNotFound>;
  deactivateAdminCouponRule: (
    ruleId: string,
  ) => Effect.Effect<AdminCouponRuleRow, CouponRuleNotFound>;
  updateAdminCouponRule: (
    ruleId: string,
    input: UpdateAdminCouponRuleInput,
  ) => Effect.Effect<AdminCouponRuleRow, CouponRuleNotFound>;
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
};

export type CouponService = CouponCommandService & CouponQueryService;
