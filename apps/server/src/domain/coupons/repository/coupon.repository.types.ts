import type { Effect } from "effect";

import type { BillingPreviewDiscountRuleRow } from "../models";

export type CouponQueryRepo = {
  listGlobalBillingPreviewDiscountRules: (
    input: {
      readonly previewedAt: Date;
      readonly billableMinutes: number;
    },
  ) => Effect.Effect<readonly BillingPreviewDiscountRuleRow[]>;
};
