import { z } from "../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";
import { WalletDetailSchema, WalletTransactionDetailSchema } from "./models";

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

export const ListMyWalletTransactionsQuerySchema = z.object({
  ...paginationQueryFields,
}).openapi("ListMyWalletTransactionsQuery");

export const ListMyWalletTransactionsResponseSchema = z.object({
  data: WalletTransactionDetailSchema.array(),
  pagination: PaginationSchema,
}).openapi("ListMyWalletTransactionsResponse");

export type WalletErrorResponse = z.infer<typeof WalletErrorResponseSchema>;
export type GetMyWalletResponse = z.infer<typeof GetMyWalletResponseSchema>;
export type ListMyWalletTransactionsResponse = z.infer<typeof ListMyWalletTransactionsResponseSchema>;
export {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
  WalletDetailSchema,
  WalletTransactionDetailSchema,
};
