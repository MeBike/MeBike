import type { Effect } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  CouponFilter,
  CouponSortField,
  UserCouponListItemRow,
} from "../models";

export type CouponQueryRepo = {
  listForUser: (
    userId: string,
    filter: CouponFilter,
    pageReq: PageRequest<CouponSortField>,
  ) => Effect.Effect<PageResult<UserCouponListItemRow>>;
};
