import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  BillingPreviewDiscountRuleRow,
  CouponFilter,
  CouponSortField,
  UserCouponDetailRow,
  UserCouponListItemRow,
} from "../models";

export type CouponQueryRepo = {
  getForUserById: (
    userId: string,
    userCouponId: string,
  ) => Effect.Effect<Option.Option<UserCouponDetailRow>>;
  listForUser: (
    userId: string,
    filter: CouponFilter,
    pageReq: PageRequest<CouponSortField>,
  ) => Effect.Effect<PageResult<UserCouponListItemRow>>;
  listGlobalBillingPreviewDiscountRules: (
    input: {
      readonly previewedAt: Date;
      readonly billableMinutes: number;
    },
  ) => Effect.Effect<readonly BillingPreviewDiscountRuleRow[]>;
};
