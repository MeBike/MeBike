import type { Effect } from "effect";

import type {
  ActiveCouponRuleRow,
  BillingPreviewDiscountRuleRow,
} from "../models";

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
};
