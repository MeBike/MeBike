import { createRoute, z } from "@hono/zod-openapi";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  StripeTopupSessionRequestSchema,
  StripeTopupSessionResponseSchema,
  WalletCreditRequestSchema,
  WalletDebitRequestSchema,
  WalletErrorCodeSchema,
  walletErrorMessages,
  WalletMutationResponseSchema,
} from "../../wallets/schemas";

export const creditMyWalletRoute = createRoute({
  method: "post",
  path: "/v1/wallets/me/credit",
  tags: ["Wallets"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: WalletCreditRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Wallet credited",
      content: {
        "application/json": {
          schema: WalletMutationResponseSchema,
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
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: WalletErrorCodeSchema,
            }),
          }),
          examples: {
            NotFound: {
              value: {
                error: walletErrorMessages.WALLET_NOT_FOUND,
                details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
              },
            },
          },
        },
      },
    },
  },
});

export const debitMyWalletRoute = createRoute({
  method: "post",
  path: "/v1/wallets/me/debit",
  tags: ["Wallets"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: WalletDebitRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Wallet debited",
      content: {
        "application/json": {
          schema: WalletMutationResponseSchema,
        },
      },
    },
    400: {
      description: "Insufficient balance",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: WalletErrorCodeSchema,
            }),
          }),
          examples: {
            InsufficientBalance: {
              value: {
                error: walletErrorMessages.INSUFFICIENT_BALANCE,
                details: { code: WalletErrorCodeSchema.enum.INSUFFICIENT_BALANCE },
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
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: WalletErrorCodeSchema,
            }),
          }),
          examples: {
            NotFound: {
              value: {
                error: walletErrorMessages.WALLET_NOT_FOUND,
                details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
              },
            },
          },
        },
      },
    },
  },
});

export const createStripeTopupSessionRoute = createRoute({
  method: "post",
  path: "/v1/wallets/me/topups/stripe/checkout",
  tags: ["Wallets"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: StripeTopupSessionRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Stripe top-up checkout session created",
      content: {
        "application/json": {
          schema: StripeTopupSessionResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid top-up request",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: WalletErrorCodeSchema,
            }),
          }),
          examples: {
            InvalidTopupRequest: {
              value: {
                error: walletErrorMessages.TOPUP_INVALID_REQUEST,
                details: { code: WalletErrorCodeSchema.enum.TOPUP_INVALID_REQUEST },
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
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: WalletErrorCodeSchema,
            }),
          }),
          examples: {
            NotFound: {
              value: {
                error: walletErrorMessages.WALLET_NOT_FOUND,
                details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
              },
            },
          },
        },
      },
    },
    500: {
      description: "Internal error while creating top-up",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: WalletErrorCodeSchema,
            }),
          }),
          examples: {
            InternalError: {
              value: {
                error: walletErrorMessages.TOPUP_INTERNAL_ERROR,
                details: { code: WalletErrorCodeSchema.enum.TOPUP_INTERNAL_ERROR },
              },
            },
          },
        },
      },
    },
    502: {
      description: "Stripe provider error",
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
                error: walletErrorMessages.TOPUP_PROVIDER_ERROR,
                details: { code: WalletErrorCodeSchema.enum.TOPUP_PROVIDER_ERROR },
              },
            },
          },
        },
      },
    },
  },
});
