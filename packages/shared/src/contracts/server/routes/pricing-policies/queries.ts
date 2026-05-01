import { createRoute } from "@hono/zod-openapi";

import {
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../helpers";
import {
  ListPricingPoliciesQuerySchema,
  PricingPolicyDetailSchema,
  PricingPolicyErrorCodeSchema,
  pricingPolicyErrorMessages,
  PricingPolicyErrorResponseSchema,
  PricingPolicyIdParamSchema,
  PricingPolicyListResponseSchema,
  PricingPolicySchema,
} from "./shared";

export const adminListPricingPoliciesRoute = createRoute({
  method: "get",
  path: "/v1/admin/pricing-policies",
  tags: ["Admin", "Pricing Policies"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListPricingPoliciesQuerySchema,
  },
  responses: {
    200: {
      description: "Admin list of pricing policies",
      content: {
        "application/json": {
          schema: PricingPolicyListResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const adminGetActivePricingPolicyRoute = createRoute({
  method: "get",
  path: "/v1/admin/pricing-policies/active",
  tags: ["Admin", "Pricing Policies"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current active pricing policy",
      content: {
        "application/json": {
          schema: PricingPolicySchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Active pricing policy not found",
      schema: PricingPolicyErrorResponseSchema,
      example: {
        error: pricingPolicyErrorMessages.ACTIVE_PRICING_POLICY_NOT_FOUND,
        details: {
          code: PricingPolicyErrorCodeSchema.enum.ACTIVE_PRICING_POLICY_NOT_FOUND,
        },
      },
    }),
    409: {
      description: "More than one active pricing policy exists",
      content: {
        "application/json": {
          schema: PricingPolicyErrorResponseSchema,
          examples: {
            ActivePricingPolicyAmbiguous: {
              value: {
                error: pricingPolicyErrorMessages.ACTIVE_PRICING_POLICY_AMBIGUOUS,
                details: {
                  code: PricingPolicyErrorCodeSchema.enum.ACTIVE_PRICING_POLICY_AMBIGUOUS,
                  pricingPolicyIds: [
                    "0195c768-3456-7f01-8234-111111111111",
                    "0195c768-3456-7f01-8234-222222222222",
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
});

export const adminGetPricingPolicyRoute = createRoute({
  method: "get",
  path: "/v1/admin/pricing-policies/{pricingPolicyId}",
  tags: ["Admin", "Pricing Policies"],
  security: [{ bearerAuth: [] }],
  request: {
    params: PricingPolicyIdParamSchema,
  },
  responses: {
    200: {
      description: "Pricing policy detail with usage summary",
      content: {
        "application/json": {
          schema: PricingPolicyDetailSchema,
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

export const pricingPoliciesQueries = {
  adminGet: adminGetPricingPolicyRoute,
  adminGetActive: adminGetActivePricingPolicyRoute,
  adminList: adminListPricingPoliciesRoute,
} as const;
