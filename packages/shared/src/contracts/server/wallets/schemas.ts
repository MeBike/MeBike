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
} from "./models";

export const WalletErrorCodeSchema = z
  .enum([
    "WALLET_NOT_FOUND",
    "INSUFFICIENT_BALANCE",
  ])
  .openapi("WalletErrorCode");

export const walletErrorMessages = {
  WALLET_NOT_FOUND: "Wallet not found",
  INSUFFICIENT_BALANCE: "Insufficient balance",
} as const;

export const WalletErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: WalletErrorCodeSchema,
  }),
}).openapi("WalletErrorResponse", {
  description: "Wallet specific error response",
});

export const GetMyWalletResponseSchema = z.object({
  data: WalletDetailSchema,
}).openapi("GetMyWalletResponse");

export const WalletMutationResponseSchema = z.object({
  data: WalletDetailSchema,
}).openapi("WalletMutationResponse");

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
export type ListMyWalletTransactionsResponse = z.infer<typeof ListMyWalletTransactionsResponseSchema>;
export {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
  WalletDetailSchema,
  WalletTransactionDetailSchema,
};
