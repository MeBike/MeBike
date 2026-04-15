import { createRoute, z } from "@hono/zod-openapi";

import {
  AdminListSubscriptionsResponseSchema,
  AdminSubscriptionDetailResponseSchema,
  ListSubscriptionPackagesResponseSchema,
  ListSubscriptionsQuerySchema,
  ListSubscriptionsResponseSchema,
  SubscriptionDetailResponseSchema,
  SubscriptionErrorCodeSchema,
  subscriptionErrorMessages,
  SubscriptionErrorResponseSchema,
} from "../../subscriptions/schemas";
import { forbiddenResponse, unauthorizedResponse } from "../helpers";

export const getSubscriptionRoute = createRoute({
  method: "get",
  path: "/v1/subscriptions/{subscriptionId}",
  tags: ["Subscriptions"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      subscriptionId: z.uuidv7(),
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
    401: unauthorizedResponse(),
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
    401: unauthorizedResponse(),
  },
});

export const adminGetSubscriptionRoute = createRoute({
  method: "get",
  path: "/v1/admin/subscriptions/{subscriptionId}",
  tags: ["Subscriptions"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      subscriptionId: z.uuidv7(),
    }),
  },
  responses: {
    200: {
      description: "Admin subscription detail",
      content: {
        "application/json": {
          schema: AdminSubscriptionDetailResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
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

export const adminListSubscriptionsRoute = createRoute({
  method: "get",
  path: "/v1/admin/subscriptions",
  tags: ["Subscriptions"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListSubscriptionsQuerySchema,
  },
  responses: {
    200: {
      description: "Admin list subscriptions",
      content: {
        "application/json": {
          schema: AdminListSubscriptionsResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const listSubscriptionPackagesRoute = createRoute({
  method: "get",
  path: "/v1/subscriptions/packages",
  tags: ["Subscriptions"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "List subscription packages",
      content: {
        "application/json": {
          schema: ListSubscriptionPackagesResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
  },
});
