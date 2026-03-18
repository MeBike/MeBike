import { createRoute, z } from "@hono/zod-openapi";

import {
} from "../../schemas";
import {
  StripeConnectOnboardingRequestSchema,
  StripeConnectOnboardingResponseSchema,
} from "../../stripe/schemas";
import {
  WalletErrorCodeSchema,
  walletErrorMessages,
} from "../../wallets/schemas";
import { unauthorizedResponse } from "../helpers";

export const startStripeConnectOnboardingRoute = createRoute({
  method: "post",
  path: "/v1/stripe/connect/onboarding/start",
  tags: ["Stripe"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: StripeConnectOnboardingRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Stripe Connect onboarding link created",
      content: {
        "application/json": {
          schema: StripeConnectOnboardingResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid onboarding request",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: WalletErrorCodeSchema,
            }),
          }),
          examples: {
            InvalidRequest: {
              value: {
                error: walletErrorMessages.WITHDRAWAL_INVALID_REQUEST,
                details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INVALID_REQUEST },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    500: {
      description: "Stripe Connect error",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: WalletErrorCodeSchema,
            }),
          }),
          examples: {
            ProviderError: {
              value: {
                error: walletErrorMessages.WITHDRAWAL_INTERNAL_ERROR,
                details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INTERNAL_ERROR },
              },
            },
          },
        },
      },
    },
    503: {
      description: "Stripe Connect not enabled",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: WalletErrorCodeSchema,
            }),
          }),
          examples: {
            ConnectNotEnabled: {
              value: {
                error: "Stripe Connect is not enabled for this Stripe account",
                details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INTERNAL_ERROR },
              },
            },
          },
        },
      },
    },
  },
});
