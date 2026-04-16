import { createRoute } from "@hono/zod-openapi";

import { ActiveCouponRulesResponseSchema } from "../../coupons";

export const listActiveCouponRules = createRoute({
  method: "get",
  path: "/v1/coupon-rules/active",
  tags: ["Coupon Rules"],
  responses: {
    200: {
      description: "Active global riding duration discount rules",
      content: {
        "application/json": {
          schema: ActiveCouponRulesResponseSchema,
        },
      },
    },
  },
});
