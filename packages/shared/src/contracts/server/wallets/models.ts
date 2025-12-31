import { z } from "../../../zod";

export const WalletStatusSchema = z.enum(["ACTIVE", "FROZEN"]).openapi("WalletStatus");

export const WalletTransactionTypeSchema = z
  .enum(["DEPOSIT", "DEBIT", "REFUND", "ADJUSTMENT"])
  .openapi("WalletTransactionType");

export const WalletTransactionStatusSchema = z
  .enum(["SUCCESS", "PENDING", "FAILED"])
  .openapi("WalletTransactionStatus");

export const WalletDetailSchema = z.object({
  id: z.uuidv7(),
  userId: z.uuidv7(),
  balance: z.string().openapi({ example: "100000" }),
  status: WalletStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("WalletDetail");

export const WalletTransactionDetailSchema = z.object({
  id: z.uuidv7(),
  walletId: z.uuidv7(),
  amount: z.string().openapi({ example: "50000" }),
  fee: z.string().openapi({ example: "0" }),
  description: z.string().nullable().optional(),
  hash: z.string().nullable().optional(),
  type: WalletTransactionTypeSchema,
  status: WalletTransactionStatusSchema,
  createdAt: z.string().datetime(),
}).openapi("WalletTransactionDetail");

export type WalletDetail = z.infer<typeof WalletDetailSchema>;
export type WalletTransactionDetail = z.infer<typeof WalletTransactionDetailSchema>;
