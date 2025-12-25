import { createRoute, z } from "@hono/zod-openapi";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  ListSubscriptionsQuerySchema,
  ListSubscriptionsResponseSchema,
  SubscriptionDetailResponseSchema,
  SubscriptionErrorCodeSchema,
  subscriptionErrorMessages,
  SubscriptionErrorResponseSchema,
} from "../../subscriptions/schemas";

export const getSubscriptionRoute = createRoute({
  method: "get",
  path: "/v1/subscriptions/{subscriptionId}",
  tags: ["Subscriptions"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      subscriptionId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Subscription detail",
      content: {
        "application/json": {
          schema: SubscriptionDetailResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Subscription not found",
      content: {
        "application/json": {
          schema: SubscriptionErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: subscriptionErrorMessages.SUBSCRIPTION_NOT_FOUND,
                details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_NOT_FOUND },
              },
            },
          },
        },
      },
    },
  },
});

export const listSubscriptionsRoute = createRoute({
  method: "get",
  path: "/v1/subscriptions",
  tags: ["Subscriptions"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListSubscriptionsQuerySchema,
  },
  responses: {
    200: {
      description: "List subscriptions",
      content: {
        "application/json": {
          schema: ListSubscriptionsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
  },
});
