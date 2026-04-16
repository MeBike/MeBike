import type { Effect } from "effect";

import type {
  ActiveCouponRuleRow,
  AdminCouponRulePageResult,
  BillingPreviewDiscountRuleRow,
  ListAdminCouponRulesFilter,
} from "../models";
import type { PageRequest } from "@/domain/shared/pagination";

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
