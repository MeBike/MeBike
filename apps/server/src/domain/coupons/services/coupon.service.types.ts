import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  BillingPreviewCouponCandidateRow,
  CouponFilter,
  CouponSortField,
  UserCouponDetailRow,
  UserCouponListItemRow,
} from "../models";

export type CouponQueryService = {
  getForUserById: (
    userId: string,
    userCouponId: string,
  ) => Effect.Effect<Option.Option<UserCouponDetailRow>>;
  listForUser: (
    userId: string,
    filter: CouponFilter,
    pageReq: PageRequest<CouponSortField>,
  ) => Effect.Effect<PageResult<UserCouponListItemRow>>;
  listBillingPreviewCandidatesForUser: (
    userId: string,
    input: {
      readonly previewedAt: Date;
      readonly billableMinutes: number;
    },
  ) => Effect.Effect<readonly BillingPreviewCouponCandidateRow[]>;
};
