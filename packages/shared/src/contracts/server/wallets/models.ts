import { z } from "../../../zod";

export const WalletStatusSchema = z.enum(["ACTIVE", "FROZEN"]).openapi("WalletStatus");

export const WalletTransactionTypeSchema = z
  .enum(["DEPOSIT", "DEBIT", "REFUND", "ADJUSTMENT"])
  .openapi("WalletTransactionType");

export const WalletTransactionStatusSchema = z
  .enum(["SUCCESS", "PENDING", "FAILED"])
  .openapi("WalletTransactionStatus");

export const WalletDetailSchema = z.object({
  id: z.string(),
  userId: z.string(),
  balance: z.string().openapi({ example: "100000.00" }),
  status: WalletStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("WalletDetail");

export const WalletTransactionDetailSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  amount: z.string().openapi({ example: "50000.00" }),
  fee: z.string().openapi({ example: "0.00" }),
  description: z.string().nullable().optional(),
  hash: z.string().nullable().optional(),
  type: WalletTransactionTypeSchema,
  status: WalletTransactionStatusSchema,
  createdAt: z.string().datetime(),
}).openapi("WalletTransactionDetail");

export type WalletDetail = z.infer<typeof WalletDetailSchema>;
export type WalletTransactionDetail = z.infer<typeof WalletTransactionDetailSchema>;
