import { createRoute } from "@hono/zod-openapi";

import {
  AdminCouponRuleSchema,
  CreateAdminCouponRuleBodySchema,
} from "../../coupons";
import {
  forbiddenResponse,
  unauthorizedResponse,
} from "../helpers";
import { ServerErrorResponseSchema } from "../../schemas";

export const adminCreateCouponRule = createRoute({
  method: "post",
  path: "/v1/admin/coupon-rules",
  tags: ["Admin", "Coupon Rules"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateAdminCouponRuleBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Admin created a global coupon rule",
      content: {
        "application/json": {
          schema: AdminCouponRuleSchema,
        },
      },
    },
    400: {
      description: "Invalid request payload",
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
