import { z } from "../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";
import {
  WalletDetailSchema,
  WalletTransactionDetailSchema,
  WalletTransactionTypeSchema,
  WalletWithdrawalDetailSchema,
} from "./models";

export const WalletErrorCodeSchema = z
  .enum([
    "WALLET_NOT_FOUND",
    "INSUFFICIENT_BALANCE",
    "TOPUP_INVALID_REQUEST",
    "TOPUP_PROVIDER_ERROR",
    "TOPUP_INTERNAL_ERROR",
    "WITHDRAWAL_INVALID_REQUEST",
    "WITHDRAWAL_NOT_ENABLED",
    "WITHDRAWAL_DUPLICATE",
    "WITHDRAWAL_INTERNAL_ERROR",
  ])
  .openapi("WalletErrorCode");

export const walletErrorMessages = {
  WALLET_NOT_FOUND: "Wallet not found",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  TOPUP_INVALID_REQUEST: "Invalid top-up request",
  TOPUP_PROVIDER_ERROR: "Top-up provider error",
  TOPUP_INTERNAL_ERROR: "Top-up internal error",
  WITHDRAWAL_INVALID_REQUEST: "Invalid withdrawal request",
  WITHDRAWAL_NOT_ENABLED: "Withdrawal not enabled",
  WITHDRAWAL_DUPLICATE: "Duplicate withdrawal request",
  WITHDRAWAL_INTERNAL_ERROR: "Withdrawal internal error",
} as const;

export const WalletErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: WalletErrorCodeSchema,
  }),
}).openapi("WalletErrorResponse", {
  description: "Wallet specific error response",
});

export const GetMyWalletResponseSchema = WalletDetailSchema.openapi("GetMyWalletResponse");

export const WalletMutationResponseSchema = WalletDetailSchema.openapi("WalletMutationResponse");

const minorUnitString = z.string().regex(/^\d+(?:\.0+)?$/);

export const WalletCreditRequestSchema = z.object({
  amount: minorUnitString.openapi({ example: "100000" }),
  fee: minorUnitString.optional().openapi({ example: "0" }),
  description: z.string().optional().nullable(),
  hash: z.string().optional().nullable(),
  type: WalletTransactionTypeSchema.optional(),
}).openapi("WalletCreditRequest");

export const WalletDebitRequestSchema = z.object({
  amount: minorUnitString.openapi({ example: "50000" }),
  description: z.string().optional().nullable(),
  hash: z.string().optional().nullable(),
  type: WalletTransactionTypeSchema.optional(),
}).openapi("WalletDebitRequest");

export const StripeTopupSessionRequestSchema = z.object({
  amount: z.string().min(1).openapi({ example: "100000" }),
  currency: z.literal("usd").openapi({ example: "usd" }),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
}).openapi("StripeTopupSessionRequest");

export const StripeTopupSessionResponseSchema = z.object({
  data: z.object({
    paymentAttemptId: z.string(),
    checkoutUrl: z.string().url(),
  }),
}).openapi("StripeTopupSessionResponse");

export const WalletWithdrawalRequestSchema = z.object({
  amount: z.string().min(1).openapi({ example: "50000" }),
  currency: z.literal("usd").optional().openapi({ example: "usd" }),
  idempotencyKey: z.string().optional(),
}).openapi("WalletWithdrawalRequest");

export const WalletWithdrawalResponseSchema = WalletWithdrawalDetailSchema.openapi("WalletWithdrawalResponse");

export const ListMyWalletTransactionsQuerySchema = z.object({
  ...paginationQueryFields,
}).openapi("ListMyWalletTransactionsQuery");

export const ListMyWalletTransactionsResponseSchema = z.object({
  data: WalletTransactionDetailSchema.array(),
  pagination: PaginationSchema,
}).openapi("ListMyWalletTransactionsResponse");

export type WalletErrorResponse = z.infer<typeof WalletErrorResponseSchema>;
export type GetMyWalletResponse = z.infer<typeof GetMyWalletResponseSchema>;
export type WalletMutationResponse = z.infer<typeof WalletMutationResponseSchema>;
export type WalletCreditRequest = z.infer<typeof WalletCreditRequestSchema>;
export type WalletDebitRequest = z.infer<typeof WalletDebitRequestSchema>;
export type StripeTopupSessionRequest = z.infer<typeof StripeTopupSessionRequestSchema>;
export type StripeTopupSessionResponse = z.infer<typeof StripeTopupSessionResponseSchema>;
export type WalletWithdrawalRequest = z.infer<typeof WalletWithdrawalRequestSchema>;
export type WalletWithdrawalResponse = z.infer<typeof WalletWithdrawalResponseSchema>;
export type ListMyWalletTransactionsResponse = z.infer<typeof ListMyWalletTransactionsResponseSchema>;
export {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
  WalletDetailSchema,
  WalletTransactionDetailSchema,
  WalletWithdrawalDetailSchema,
};
