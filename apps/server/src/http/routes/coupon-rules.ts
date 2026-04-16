import { serverRoutes } from "@mebike/shared";

import { CouponRulesPublicController } from "@/http/controllers/coupons";

export function registerCouponRuleRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const couponRules = serverRoutes.couponRules;

  app.openapi(
    couponRules.listActiveCouponRules,
    CouponRulesPublicController.listActiveCouponRules,
  );
}
