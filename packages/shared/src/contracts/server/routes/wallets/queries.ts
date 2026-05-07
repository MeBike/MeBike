import { createRoute, z } from "@hono/zod-openapi";

import {
  AdminListUserWalletTransactionsQuerySchema,
  AdminListUserWalletTransactionsResponseSchema,
  GetMyWalletResponseSchema,
  GetMyWalletWithdrawalResponseSchema,
  ListMyWalletTransactionsQuerySchema,
  ListMyWalletTransactionsResponseSchema,
  ListMyWalletWithdrawalsQuerySchema,
  ListMyWalletWithdrawalsResponseSchema,
  WalletErrorCodeSchema,
  walletErrorMessages,
} from "../../wallets/schemas";
import {
  forbiddenResponse,
  notFoundResponse,
  paginatedResponse,
  unauthorizedResponse,
} from "../helpers";

const WalletUserIdParamSchema = z.object({
  userId: z.uuidv7().openapi({
    example: "019b17bd-d130-7e7d-be69-91ceef7b6999",
    description: "User identifier",
  }),
}).openapi("WalletUserIdParam");

const WalletWithdrawalIdParamSchema = z.object({
  withdrawalId: z.uuidv7().openapi({
    example: "019b17bd-d130-7e7d-be69-91ceef7b6999",
    description: "Wallet withdrawal identifier",
  }),
}).openapi("WalletWithdrawalIdParam");

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
    401: unauthorizedResponse(),
    404: notFoundResponse({
      description: "Wallet not found",
      schema: z.object({
        error: z.string(),
        details: z.object({
          code: WalletErrorCodeSchema,
        }),
      }),
      example: {
        error: walletErrorMessages.WALLET_NOT_FOUND,
        details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
      },
    }),
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
    200: paginatedResponse(ListMyWalletTransactionsResponseSchema, "Paginated wallet transactions"),
    401: unauthorizedResponse(),
    404: notFoundResponse({
      description: "Wallet not found",
      schema: z.object({
        error: z.string(),
        details: z.object({
          code: WalletErrorCodeSchema,
        }),
      }),
      example: {
        error: walletErrorMessages.WALLET_NOT_FOUND,
        details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
      },
    }),
  },
});

export const listMyWalletWithdrawalsRoute = createRoute({
  method: "get",
  path: "/v1/wallets/me/withdrawals",
  tags: ["Wallets"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ListMyWalletWithdrawalsQuerySchema,
  },
  responses: {
    200: paginatedResponse(ListMyWalletWithdrawalsResponseSchema, "Paginated wallet withdrawals"),
    401: unauthorizedResponse(),
  },
});

export const getMyWalletWithdrawalRoute = createRoute({
  method: "get",
  path: "/v1/wallets/me/withdrawals/{withdrawalId}",
  tags: ["Wallets"],
  security: [{ bearerAuth: [] }],
  request: {
    params: WalletWithdrawalIdParamSchema,
  },
  responses: {
    200: {
      description: "Current user's wallet withdrawal",
      content: {
        "application/json": {
          schema: GetMyWalletWithdrawalResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    404: notFoundResponse({
      description: "Withdrawal not found",
      schema: z.object({
        error: z.string(),
        details: z.object({
          code: WalletErrorCodeSchema,
        }),
      }),
      example: {
        error: walletErrorMessages.WITHDRAWAL_NOT_FOUND,
        details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_NOT_FOUND },
      },
    }),
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
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Wallet not found",
      schema: z.object({
        error: z.string(),
        details: z.object({
          code: WalletErrorCodeSchema,
        }),
      }),
      example: {
        error: walletErrorMessages.WALLET_NOT_FOUND,
        details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
      },
    }),
  },
});

export const adminListUserWalletTransactionsRoute = createRoute({
  method: "get",
  path: "/v1/admin/users/{userId}/wallet/transactions",
  tags: ["Admin", "Wallets"],
  security: [{ bearerAuth: [] }],
  request: {
    params: WalletUserIdParamSchema,
    query: AdminListUserWalletTransactionsQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated wallet transactions for a specific user",
      content: {
        "application/json": {
          schema: AdminListUserWalletTransactionsResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Wallet not found",
      schema: z.object({
        error: z.string(),
        details: z.object({
          code: WalletErrorCodeSchema,
        }),
      }),
      example: {
        error: walletErrorMessages.WALLET_NOT_FOUND,
        details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
      },
    }),
  },
});
