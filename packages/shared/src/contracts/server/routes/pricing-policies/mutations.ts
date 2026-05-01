import { createRoute } from "@hono/zod-openapi";

import {
  forbiddenResponse,
  jsonBody,
  notFoundResponse,
  unauthorizedResponse,
} from "../helpers";
import {
  CreatePricingPolicyBodySchema,
  PricingPolicyErrorCodeSchema,
  pricingPolicyErrorMessages,
  PricingPolicyErrorResponseSchema,
  PricingPolicyIdParamSchema,
  PricingPolicySchema,
  UpdatePricingPolicyBodySchema,
} from "./shared";

export const adminCreatePricingPolicyRoute = createRoute({
  method: "post",
  path: "/v1/admin/pricing-policies",
  tags: ["Admin", "Pricing Policies"],
  security: [{ bearerAuth: [] }],
  request: jsonBody(CreatePricingPolicyBodySchema),
  responses: {
    201: {
      description: "Admin created a new inactive pricing policy draft",
      content: {
        "application/json": {
          schema: PricingPolicySchema,
        },
      },
    },
    400: {
      description: "Request payload or pricing policy input failed validation",
      content: {
        "application/json": {
          schema: PricingPolicyErrorResponseSchema,
          examples: {
            ValidationError: {
              value: {
                error: pricingPolicyErrorMessages.VALIDATION_ERROR,
                details: {
                  code: PricingPolicyErrorCodeSchema.enum.VALIDATION_ERROR,
                  issues: [
                    {
                      path: "body.base_rate",
                      message: "Expected number, received string",
                      code: "invalid_type",
                    },
                  ],
                },
              },
            },
            PricingPolicyInvalidInput: {
              value: {
                error: pricingPolicyErrorMessages.PRICING_POLICY_INVALID_INPUT,
                details: {
                  code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_INVALID_INPUT,
                  issues: [
                    {
                      path: "baseRate",
                      message: "baseRate must be between 1000 and 1000000 VND",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const adminUpdatePricingPolicyRoute = createRoute({
  method: "patch",
  path: "/v1/admin/pricing-policies/{pricingPolicyId}",
  tags: ["Admin", "Pricing Policies"],
  security: [{ bearerAuth: [] }],
  request: {
    params: PricingPolicyIdParamSchema,
    ...jsonBody(UpdatePricingPolicyBodySchema),
  },
  responses: {
    200: {
      description: "Admin updated an unused pricing policy draft",
      content: {
        "application/json": {
          schema: PricingPolicySchema,
        },
      },
    },
    400: {
      description: "Request payload or pricing policy input failed validation",
      content: {
        "application/json": {
          schema: PricingPolicyErrorResponseSchema,
          examples: {
            ValidationError: {
              value: {
                error: pricingPolicyErrorMessages.VALIDATION_ERROR,
                details: {
                  code: PricingPolicyErrorCodeSchema.enum.VALIDATION_ERROR,
                  issues: [
                    {
                      path: "body.late_return_cutoff",
                      message: "Invalid string: must match pattern /^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/",
                    },
                  ],
                },
              },
            },
            PricingPolicyInvalidInput: {
              value: {
                error: pricingPolicyErrorMessages.PRICING_POLICY_INVALID_INPUT,
                details: {
                  code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_INVALID_INPUT,
                  issues: [
                    {
                      path: "billingUnitMinutes",
                      message: "billingUnitMinutes must be between 1 and 1440 minutes",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Pricing policy not found",
      schema: PricingPolicyErrorResponseSchema,
      example: {
        error: pricingPolicyErrorMessages.PRICING_POLICY_NOT_FOUND,
        details: {
          code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_NOT_FOUND,
          pricingPolicyId: "0195c768-3456-7f01-8234-111111111111",
        },
      },
    }),
    409: {
      description: "Pricing policy is already used and cannot be changed",
      content: {
        "application/json": {
          schema: PricingPolicyErrorResponseSchema,
          examples: {
            PricingPolicyAlreadyUsed: {
              value: {
                error: pricingPolicyErrorMessages.PRICING_POLICY_ALREADY_USED,
                details: {
                  code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_ALREADY_USED,
                  pricingPolicyId: "0195c768-3456-7f01-8234-111111111111",
                  reservationCount: 1,
                  rentalCount: 0,
                  billingRecordCount: 0,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const adminActivatePricingPolicyRoute = createRoute({
  method: "patch",
  path: "/v1/admin/pricing-policies/{pricingPolicyId}/activate",
  tags: ["Admin", "Pricing Policies"],
  security: [{ bearerAuth: [] }],
  request: {
    params: PricingPolicyIdParamSchema,
  },
  responses: {
    200: {
      description: "Admin activated a pricing policy",
      content: {
        "application/json": {
          schema: PricingPolicySchema,
        },
      },
    },
    400: {
      description: "Activation is not allowed outside the overnight admin window",
      content: {
        "application/json": {
          schema: PricingPolicyErrorResponseSchema,
          examples: {
            PricingPolicyMutationWindowClosed: {
              value: {
                error: pricingPolicyErrorMessages.PRICING_POLICY_MUTATION_WINDOW_CLOSED,
                details: {
                  code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_MUTATION_WINDOW_CLOSED,
                  currentTime: "2026-04-20T22:00:00+07:00",
                  timeZone: "Asia/Ho_Chi_Minh",
                  windowStart: "23:00",
                  windowEnd: "05:00",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Pricing policy not found",
      schema: PricingPolicyErrorResponseSchema,
      example: {
        error: pricingPolicyErrorMessages.PRICING_POLICY_NOT_FOUND,
        details: {
          code: PricingPolicyErrorCodeSchema.enum.PRICING_POLICY_NOT_FOUND,
          pricingPolicyId: "0195c768-3456-7f01-8234-111111111111",
        },
      },
    }),
  },
});

export const pricingPoliciesMutations = {
  adminActivate: adminActivatePricingPolicyRoute,
  adminCreate: adminCreatePricingPolicyRoute,
  adminUpdate: adminUpdatePricingPolicyRoute,
} as const;
