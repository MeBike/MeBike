import { createRoute, z } from "@hono/zod-openapi";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  ActivateSubscriptionResponseSchema,
  CreateSubscriptionRequestSchema,
  CreateSubscriptionResponseSchema,
  SubscriptionErrorCodeSchema,
  subscriptionErrorMessages,
  SubscriptionErrorResponseSchema,
} from "../../subscriptions/schemas";

export const createSubscriptionRoute = createRoute({
  method: "post",
  path: "/v1/subscriptions/subscribe",
  tags: ["Subscriptions"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateSubscriptionRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Subscription created",
      content: {
        "application/json": {
          schema: CreateSubscriptionResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid subscription request",
      content: {
        "application/json": {
          schema: SubscriptionErrorResponseSchema,
          examples: {
            InsufficientBalance: {
              value: {
                error: subscriptionErrorMessages.INSUFFICIENT_WALLET_BALANCE,
                details: { code: SubscriptionErrorCodeSchema.enum.INSUFFICIENT_WALLET_BALANCE },
              },
            },
          },
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
      description: "Wallet not found",
      content: {
        "application/json": {
          schema: SubscriptionErrorResponseSchema,
          examples: {
            WalletNotFound: {
              value: {
                error: subscriptionErrorMessages.WALLET_NOT_FOUND,
                details: { code: SubscriptionErrorCodeSchema.enum.WALLET_NOT_FOUND },
              },
            },
          },
        },
      },
    },
    409: {
      description: "Existing pending/active subscription",
      content: {
        "application/json": {
          schema: SubscriptionErrorResponseSchema,
          examples: {
            PendingOrActive: {
              value: {
                error: subscriptionErrorMessages.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS,
                details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS },
              },
            },
          },
        },
      },
    },
  },
});

export const activateSubscriptionRoute = createRoute({
  method: "post",
  path: "/v1/subscriptions/{subscriptionId}/activate",
  tags: ["Subscriptions"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      subscriptionId: z.uuidv7(),
    }),
  },
  responses: {
    200: {
      description: "Subscription activated",
      content: {
        "application/json": {
          schema: ActivateSubscriptionResponseSchema,
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
    409: {
      description: "Active subscription exists",
      content: {
        "application/json": {
          schema: SubscriptionErrorResponseSchema,
          examples: {
            ActiveExists: {
              value: {
                error: subscriptionErrorMessages.ACTIVE_SUBSCRIPTION_EXISTS,
                details: { code: SubscriptionErrorCodeSchema.enum.ACTIVE_SUBSCRIPTION_EXISTS },
              },
            },
          },
        },
      },
    },
    400: {
      description: "Subscription not pending",
      content: {
        "application/json": {
          schema: SubscriptionErrorResponseSchema,
          examples: {
            NotPending: {
              value: {
                error: subscriptionErrorMessages.SUBSCRIPTION_NOT_PENDING,
                details: { code: SubscriptionErrorCodeSchema.enum.SUBSCRIPTION_NOT_PENDING },
              },
            },
          },
        },
      },
    },
  },
});
