import {
  RentalCountsResponseSchema,
  RentalSchema,
  ReservationDetailSchema,
  ReservationExpandedDetailSchema,
  WalletDetailSchema,
  WalletTransactionDetailSchema,
} from "@mebike/shared";
import { z } from "zod";

const RentalSummaryItemSchema = RentalSchema.extend({
  totalPriceDisplay: z.string().nullable(),
}).strict();

const ReservationSummaryItemSchema = ReservationDetailSchema.extend({
  prepaidDisplay: z.string().nullable(),
}).strict();

const RentalDetailSchema = RentalSchema.extend({
  totalPriceDisplay: z.string().nullable(),
  depositAmountDisplay: z.string().nullable(),
}).strict();

const ReservationExpandedDetailToolSchema = ReservationExpandedDetailSchema.extend({
  prepaidDisplay: z.string().nullable(),
}).strict();

const WalletSummarySchema = WalletDetailSchema.extend({
  balanceDisplay: z.string().nullable(),
  availableBalanceDisplay: z.string().nullable(),
  reservedBalanceDisplay: z.string().nullable(),
}).strict();

const WalletTransactionSummarySchema = WalletTransactionDetailSchema.extend({
  amountDisplay: z.string().nullable(),
  feeDisplay: z.string().nullable(),
}).strict();

const WalletTransactionDetailToolSchema = WalletTransactionDetailSchema.extend({
  amountDisplay: z.string().nullable(),
  feeDisplay: z.string().nullable(),
}).strict();

const RentalDetailReferenceSchema = z.enum(["context", "current", "latest", "id"]);
const ReservationDetailReferenceSchema = z.enum(["context", "latestPendingOrActive", "id"]);
const WalletTransactionDetailReferenceSchema = z.enum(["latest", "id"]);

export const CurrentRentalSummaryToolOutputSchema = z.object({
  activeRentalCount: z.number().int().nonnegative(),
  counts: RentalCountsResponseSchema,
  rentals: z.array(RentalSummaryItemSchema),
}).strict();

export const ReservationSummaryToolOutputSchema = z.object({
  latestPendingOrActive: ReservationSummaryItemSchema.nullable(),
  reservations: z.array(ReservationSummaryItemSchema),
}).strict();

export const WalletSummaryToolOutputSchema = z.object({
  hasWallet: z.boolean(),
  wallet: WalletSummarySchema.nullable(),
  recentTransactions: z.array(WalletTransactionSummarySchema),
}).strict();

export const RentalDetailToolOutputSchema = z.object({
  reference: RentalDetailReferenceSchema,
  detail: RentalDetailSchema.nullable(),
}).strict();

export const ReservationDetailToolOutputSchema = z.object({
  reference: ReservationDetailReferenceSchema,
  detail: ReservationExpandedDetailToolSchema.nullable(),
}).strict();

export const WalletTransactionDetailToolOutputSchema = z.object({
  reference: WalletTransactionDetailReferenceSchema,
  detail: WalletTransactionDetailToolSchema.nullable(),
}).strict();
