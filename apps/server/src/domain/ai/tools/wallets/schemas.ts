import {
  WalletDetailSchema,
  WalletTransactionDetailSchema,
} from "@mebike/shared";
import { z } from "zod";

const WalletTransactionDetailReferenceSchema = z.enum(["latest", "id"]);

const WalletSummarySchema = WalletDetailSchema.extend({
  balanceDisplay: z.string().nullable(),
  availableBalanceDisplay: z.string().nullable(),
  createdAtDisplay: z.string().nullable(),
  reservedBalanceDisplay: z.string().nullable(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const WalletTransactionSummarySchema = WalletTransactionDetailSchema.extend({
  amountDisplay: z.string().nullable(),
  createdAtDisplay: z.string().nullable(),
  feeDisplay: z.string().nullable(),
}).strict();

const WalletTransactionDetailToolSchema = WalletTransactionDetailSchema.extend({
  amountDisplay: z.string().nullable(),
  createdAtDisplay: z.string().nullable(),
  feeDisplay: z.string().nullable(),
}).strict();

export const WalletSummaryToolOutputSchema = z.object({
  hasWallet: z.boolean(),
  wallet: WalletSummarySchema.nullable(),
  recentTransactions: z.array(WalletTransactionSummarySchema),
}).strict();

export const WalletTransactionDetailToolOutputSchema = z.object({
  reference: WalletTransactionDetailReferenceSchema,
  detail: WalletTransactionDetailToolSchema.nullable(),
}).strict();
