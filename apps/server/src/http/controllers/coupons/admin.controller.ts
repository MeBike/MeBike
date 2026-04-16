import type { RouteHandler } from "@hono/zod-openapi";
import type { CouponsContracts } from "@mebike/shared";

import { Effect } from "effect";

import { CouponQueryServiceTag } from "@/domain/coupons";
import { withLoggedCause } from "@/domain/shared";
import { toContractAdminCouponRule } from "@/http/presenters/coupons.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { CouponRulesRoutes } from "./shared";

const adminListCouponRules: RouteHandler<
  CouponRulesRoutes["adminListCouponRules"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.flatMap(CouponQueryServiceTag, service =>
      service.listAdminCouponRules(
        {
          status: query.status,
          triggerType: query.triggerType,
          discountType: query.discountType,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
        },
      )),
    "GET /v1/admin/coupon-rules",
  );

  const result = await c.var.runPromise(eff);

  return c.json<CouponsContracts.AdminCouponRulesListResponse, 200>({
    data: result.items.map(toContractAdminCouponRule),
    pagination: toContractPage(result),
  }, 200);
};

export const CouponRulesAdminController = {
  adminListCouponRules,
} as const;
