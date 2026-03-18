import { createRoute, z } from "@hono/zod-openapi";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  GetMyWalletResponseSchema,
  ListMyWalletTransactionsQuerySchema,
  ListMyWalletTransactionsResponseSchema,
  WalletErrorCodeSchema,
  walletErrorMessages,
} from "../../wallets/schemas";

const WalletUserIdParamSchema = z.object({
  userId: z.uuidv7().openapi({
    example: "019b17bd-d130-7e7d-be69-91ceef7b6999",
    description: "User identifier",
  }),
}).openapi("WalletUserIdParam");

export const getMyWalletRoute = createRoute({
  method: "get",
  path: "/v1/wallets/me",
  tags: ["Wallets"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current user's wallet",
      content: {
        "application/json": {
          schema: GetMyWalletResponseSchema,
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

export const listMyWalletTransactionsRoute = createRoute({
  method: "get",
  path: "/v1/wallets/me/transactions",
  tags: ["Wallets"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListMyWalletTransactionsQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated wallet transactions",
      content: {
        "application/json": {
          schema: ListMyWalletTransactionsResponseSchema,
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

export const adminGetUserWalletRoute = createRoute({
  method: "get",
  path: "/v1/admin/users/{userId}/wallet",
  tags: ["Admin", "Wallets"],
  security: [{ bearerAuth: [] }],
  request: {
    params: WalletUserIdParamSchema,
  },
  responses: {
    200: {
      description: "Wallet detail for a specific user",
      content: {
        "application/json": {
          schema: GetMyWalletResponseSchema,
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
    403: {
      description: "Forbidden - Admin access required",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
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

export const adminListUserWalletTransactionsRoute = createRoute({
  method: "get",
  path: "/v1/admin/users/{userId}/wallet/transactions",
  tags: ["Admin", "Wallets"],
  security: [{ bearerAuth: [] }],
  request: {
    params: WalletUserIdParamSchema,
    query: ListMyWalletTransactionsQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated wallet transactions for a specific user",
      content: {
        "application/json": {
          schema: ListMyWalletTransactionsResponseSchema,
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
    403: {
      description: "Forbidden - Admin access required",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
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
