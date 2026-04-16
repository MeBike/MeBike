import { createRoute, z } from "@hono/zod-openapi";

import {
  CouponDetailResponseSchema,
  CouponErrorCodeSchema,
  couponErrorMessages,
  CouponErrorResponseSchema,
  ListCouponsQuerySchema,
  ListCouponsResponseSchema,
} from "../../coupons/schemas";
import {
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../helpers";

export const getCouponRoute = createRoute({
  method: "get",
  path: "/v1/coupons/{userCouponId}",
  tags: ["Coupons"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userCouponId: z.uuidv7(),
    }),
  },
  responses: {
    200: {
      description: "Current user's coupon detail",
      content: {
        "application/json": {
          schema: CouponDetailResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("User"),
    404: notFoundResponse({
      description: "Coupon not found",
      schema: CouponErrorResponseSchema,
      example: {
        error: couponErrorMessages.COUPON_NOT_FOUND,
        details: { code: CouponErrorCodeSchema.enum.COUPON_NOT_FOUND },
      },
    }),
  },
});

export const listCouponsRoute = createRoute({
  method: "get",
  path: "/v1/coupons",
  tags: ["Coupons"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListCouponsQuerySchema,
  },
  responses: {
    200: {
      description: "Current user's coupons",
      content: {
        "application/json": {
          schema: ListCouponsResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("User"),
  },
});
