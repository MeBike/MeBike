import { createRoute } from "@hono/zod-openapi";

import {
  AdminCouponStatsQuerySchema,
  AdminCouponStatsResponseSchema,
  ActiveCouponRulesResponseSchema,
  AdminCouponRulesListQuerySchema,
  AdminCouponRulesListResponseSchema,
} from "../../coupons";
import { ServerErrorResponseSchema } from "../../schemas";
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

export const adminCouponStats = createRoute({
  method: "get",
  path: "/v1/admin/coupon-stats",
  tags: ["Admin", "Coupon Rules"],
  security: [{ bearerAuth: [] }],
  request: {
    query: AdminCouponStatsQuerySchema,
  },
  responses: {
    200: {
      description: "Admin statistics for global auto discount usage based on finalized billing records",
      content: {
        "application/json": {
          schema: AdminCouponStatsResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid query parameters",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});
