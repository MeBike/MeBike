import { createRoute } from "@hono/zod-openapi";

import {
  AdminCouponRuleSchema,
  CouponRuleErrorCodeSchema,
  CouponRuleErrorResponseSchema,
  CouponRuleIdParamSchema,
  CreateAdminCouponRuleBodySchema,
  UpdateAdminCouponRuleBodySchema,
  couponRuleErrorMessages,
} from "../../coupons";
import {
  forbiddenResponse,
  notFoundResponse,
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

export const adminUpdateCouponRule = createRoute({
  method: "put",
  path: "/v1/admin/coupon-rules/{ruleId}",
  tags: ["Admin", "Coupon Rules"],
  security: [{ bearerAuth: [] }],
  request: {
    params: CouponRuleIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateAdminCouponRuleBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Admin updated a global coupon rule",
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
    404: notFoundResponse({
      description: "Coupon rule not found",
      schema: CouponRuleErrorResponseSchema,
      example: {
        error: couponRuleErrorMessages.COUPON_RULE_NOT_FOUND,
        details: {
          code: CouponRuleErrorCodeSchema.enum.COUPON_RULE_NOT_FOUND,
          ruleId: "019b17bd-d130-7e7d-be69-91ceef7b7299",
        },
      },
    }),
  },
});

export const adminActivateCouponRule = createRoute({
  method: "patch",
  path: "/v1/admin/coupon-rules/{ruleId}/activate",
  tags: ["Admin", "Coupon Rules"],
  security: [{ bearerAuth: [] }],
  request: {
    params: CouponRuleIdParamSchema,
  },
  responses: {
    200: {
      description: "Admin activated a global coupon rule. Idempotent when the rule is already active.",
      content: {
        "application/json": {
          schema: AdminCouponRuleSchema,
        },
      },
    },
    400: {
      description: "Invalid path parameter",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Coupon rule not found",
      schema: CouponRuleErrorResponseSchema,
      example: {
        error: couponRuleErrorMessages.COUPON_RULE_NOT_FOUND,
        details: {
          code: CouponRuleErrorCodeSchema.enum.COUPON_RULE_NOT_FOUND,
          ruleId: "019b17bd-d130-7e7d-be69-91ceef7b7299",
        },
      },
    }),
  },
});

export const adminDeactivateCouponRule = createRoute({
  method: "patch",
  path: "/v1/admin/coupon-rules/{ruleId}/deactivate",
  tags: ["Admin", "Coupon Rules"],
  security: [{ bearerAuth: [] }],
  request: {
    params: CouponRuleIdParamSchema,
  },
  responses: {
    200: {
      description: "Admin deactivated a global coupon rule. Idempotent when the rule is already inactive.",
      content: {
        "application/json": {
          schema: AdminCouponRuleSchema,
        },
      },
    },
    400: {
      description: "Invalid path parameter",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Coupon rule not found",
      schema: CouponRuleErrorResponseSchema,
      example: {
        error: couponRuleErrorMessages.COUPON_RULE_NOT_FOUND,
        details: {
          code: CouponRuleErrorCodeSchema.enum.COUPON_RULE_NOT_FOUND,
          ruleId: "019b17bd-d130-7e7d-be69-91ceef7b7299",
        },
      },
    }),
  },
});
