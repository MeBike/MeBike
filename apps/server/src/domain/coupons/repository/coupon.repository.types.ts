import type { Effect } from "effect";

import type {
  ActiveCouponRuleRow,
  AdminCouponRulePageResult,
  AdminCouponRuleRow,
  BillingPreviewDiscountRuleRow,
  CreateCouponRuleData,
  ListAdminCouponRulesFilter,
} from "../models";
import type { PageRequest } from "@/domain/shared/pagination";

export type CouponCommandRepo = {
  createAdminCouponRule: (
    data: CreateCouponRuleData,
  ) => Effect.Effect<AdminCouponRuleRow>;
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
};
