import { createRoute } from "@hono/zod-openapi";

import {
  ActiveCouponRulesResponseSchema,
  AdminCouponRulesListQuerySchema,
  AdminCouponRulesListResponseSchema,
} from "../../coupons";
import {
  forbiddenResponse,
  unauthorizedResponse,
} from "../helpers";

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

export const adminListCouponRules = createRoute({
  method: "get",
  path: "/v1/admin/coupon-rules",
  tags: ["Admin", "Coupon Rules"],
  security: [{ bearerAuth: [] }],
  request: {
    query: AdminCouponRulesListQuerySchema,
  },
  responses: {
    200: {
      description: "Admin list global coupon rules",
      content: {
        "application/json": {
          schema: AdminCouponRulesListResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});
