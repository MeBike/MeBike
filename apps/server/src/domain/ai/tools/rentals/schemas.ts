import {
  RentalCountsResponseSchema,
  RentalSchema,
  RentalsContracts,
} from "@mebike/shared";
import { z } from "zod";

import {
  ActionFailureKindSchema,
  StationSummaryInfoSchema,
} from "../shared/customer-tool-schema-common";

const QueryRentalsScopeSchema = z.enum(["current", "recent", "all"]);
const RentalDetailReferenceSchema = z.enum(["current", "latest", "id"]);
const RentalBillingDetailReferenceSchema = z.enum(["latestCompleted", "id"]);
const ReturnSlotReferenceSchema = z.enum(["current", "latest", "id"]);

const RentalSummaryItemSchema = RentalSchema.extend({
  startStationInfo: StationSummaryInfoSchema.nullable(),
  endStationInfo: StationSummaryInfoSchema.nullable(),
  endTimeDisplay: z.string().nullable().optional(),
  startTimeDisplay: z.string().nullable(),
  statusLabel: z.string(),
  totalPriceDisplay: z.string().nullable(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const RentalDetailSchema = RentalSchema.extend({
  depositAmountDisplay: z.string().nullable(),
  startStationInfo: StationSummaryInfoSchema.nullable(),
  endStationInfo: StationSummaryInfoSchema.nullable(),
  endTimeDisplay: z.string().nullable().optional(),
  startTimeDisplay: z.string().nullable(),
  statusLabel: z.string(),
  totalPriceDisplay: z.string().nullable(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const RentalBillingDetailToolSchema = RentalsContracts.RentalBillingDetailSchema.extend({
  appliedAtDisplay: z.string().nullable(),
  baseAmountDisplay: z.string().nullable(),
  couponApplied: z.boolean(),
  couponDiscountAmountDisplay: z.string().nullable(),
  prepaidAmountDisplay: z.string().nullable(),
  subscriptionDiscountAmountDisplay: z.string().nullable(),
  subscriptionDiscountApplied: z.boolean(),
  totalAmountDisplay: z.string().nullable(),
}).strict();

const RentalBillingDetailErrorCodeSchema = z.enum([
  "MISSING_RENTAL_ID",
  "NO_COMPLETED_RENTAL",
  "RENTAL_NOT_FOUND",
  "BILLING_DETAIL_REQUIRES_COMPLETED_RENTAL",
  "BILLING_DETAIL_NOT_READY",
]);

const RentalBillingDetailErrorSchema = z.object({
  code: RentalBillingDetailErrorCodeSchema,
  status: RentalsContracts.RentalStatusSchema.nullable().optional(),
  userMessage: z.string(),
}).strict();

const ReturnSlotAiDetailSchema = RentalsContracts.ReturnSlotReservationSchema.extend({
  createdAtDisplay: z.string().nullable(),
  reservedFromDisplay: z.string().nullable(),
  statusLabel: z.string(),
  station: StationSummaryInfoSchema.nullable(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const ReturnSlotActionFailureCodeSchema = z.enum([
  "INVALID_RENTAL_ID",
  "INVALID_STATION_ID",
  "MISSING_STATION_ID",
  "NO_ACTIVE_RENTAL",
  "STATION_NOT_FOUND",
  "RETURN_CAPACITY_UNAVAILABLE",
  "RETURN_SLOT_NOT_FOUND",
  "TEMPORARY_UNAVAILABLE",
]);

const ReturnSlotActionSuggestedActionSchema = z.enum([
  "check_current_rental",
  "choose_station_again",
  "search_stations",
  "choose_another_station",
  "check_current_return_slot",
  "retry_later",
]);

const ReturnSlotActionFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: ReturnSlotActionFailureCodeSchema,
    kind: ActionFailureKindSchema,
    retryable: z.boolean(),
    suggestedAction: ReturnSlotActionSuggestedActionSchema,
    userMessage: z.string(),
  }).strict(),
}).strict();

const ReturnSlotActionSuccessSchema = z.object({
  ok: z.literal(true),
  rentalId: z.uuidv7(),
  returnSlot: ReturnSlotAiDetailSchema,
}).strict();

export const QueryRentalsToolOutputSchema = z.object({
  counts: RentalCountsResponseSchema.nullable(),
  rentals: z.array(RentalSummaryItemSchema),
  limit: z.number().int().positive(),
  scope: QueryRentalsScopeSchema,
  status: RentalsContracts.RentalStatusSchema.nullable(),
  totalMatching: z.number().int().nonnegative(),
}).strict();

export const RentalDetailToolOutputSchema = z.object({
  reference: RentalDetailReferenceSchema,
  detail: RentalDetailSchema.nullable(),
}).strict();

export const RentalBillingDetailToolOutputSchema = z.object({
  reference: RentalBillingDetailReferenceSchema,
  rentalId: z.uuidv7().nullable(),
  detail: RentalBillingDetailToolSchema.nullable(),
  error: RentalBillingDetailErrorSchema.nullable(),
}).strict();

export const RentalDetailsToolOutputSchema = z.object({
  details: z.array(RentalDetailSchema),
  missingRentalIds: z.array(z.uuidv7()),
  requestedCount: z.number().int().nonnegative(),
  returnedCount: z.number().int().nonnegative(),
}).strict();

export const CurrentReturnSlotToolOutputSchema = z.object({
  reference: ReturnSlotReferenceSchema,
  hasActiveRental: z.boolean(),
  rentalId: z.uuidv7().nullable(),
  returnSlot: ReturnSlotAiDetailSchema.nullable(),
}).strict();

export const CreateReturnSlotToolOutputSchema = z.object({
  ok: z.literal(true),
  rentalId: z.uuidv7(),
  returnSlot: ReturnSlotAiDetailSchema,
}).strict().or(ReturnSlotActionFailureSchema);

export const CancelReturnSlotToolOutputSchema = z.object({
  ok: z.literal(true),
  rentalId: z.uuidv7(),
  returnSlot: ReturnSlotAiDetailSchema,
}).strict().or(ReturnSlotActionFailureSchema);

export const SwitchReturnSlotToolOutputSchema = ReturnSlotActionSuccessSchema.or(ReturnSlotActionFailureSchema);
