import type { RouteHandler } from "@hono/zod-openapi";
import type { CouponsContracts } from "@mebike/shared";

import { Effect } from "effect";

import { CouponQueryServiceTag } from "@/domain/coupons";
import { withLoggedCause } from "@/domain/shared";
import { toContractActiveCouponRules } from "@/http/presenters/coupons.presenter";

import type { CouponRulesRoutes } from "./shared";

const listActiveCouponRules: RouteHandler<
  CouponRulesRoutes["listActiveCouponRules"]
> = async (c) => {
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* CouponQueryServiceTag;
      return yield* service.listActiveGlobalCouponRules({ now: new Date() });
    }),
    "GET /v1/coupon-rules/active",
  );

  const rows = await c.var.runPromise(eff);
  return c.json<CouponsContracts.ActiveCouponRulesResponse, 200>(
    toContractActiveCouponRules(rows),
    200,
  );
};

export const CouponRulesPublicController = {
  listActiveCouponRules,
} as const;
