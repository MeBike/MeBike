import {
  ReservationDetailSchema,
  ReservationExpandedDetailSchema,
} from "@mebike/shared";
import { z } from "zod";

import {
  ActionFailureKindSchema,
  StationSummaryInfoSchema,
} from "../shared/customer-tool-schema-common";

const ReservationDetailReferenceSchema = z.enum(["latestPendingOrActive", "id"]);

const ReservationSummaryItemSchema = ReservationDetailSchema.extend({
  createdAtDisplay: z.string().nullable(),
  endTimeDisplay: z.string().nullable().optional(),
  prepaidDisplay: z.string().nullable(),
  startTimeDisplay: z.string().nullable(),
  statusLabel: z.string(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const ReservationExpandedDetailToolSchema = ReservationExpandedDetailSchema.extend({
  createdAtDisplay: z.string().nullable(),
  endTimeDisplay: z.string().nullable().optional(),
  prepaidDisplay: z.string().nullable(),
  startTimeDisplay: z.string().nullable(),
  statusLabel: z.string(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const ReserveBikeActionFailureCodeSchema = z.enum([
  "ACTIVE_RESERVATION_EXISTS",
  "BIKE_ALREADY_RESERVED",
  "BIKE_NOT_FOUND",
  "BIKE_NOT_FOUND_IN_STATION",
  "BIKE_IS_REDISTRIBUTING",
  "BIKE_IS_LOST",
  "BIKE_IS_DISABLED",
  "BIKE_NOT_AVAILABLE",
  "STATION_RESERVATION_AVAILABILITY_TOO_LOW",
  "WALLET_NOT_FOUND",
  "INSUFFICIENT_WALLET_BALANCE",
  "OVERNIGHT_OPERATIONS_CLOSED",
  "TEMPORARY_UNAVAILABLE",
]);

const CancelReservationActionFailureCodeSchema = z.enum([
  "NO_CANCELLABLE_RESERVATION",
  "RESERVATION_NOT_FOUND",
  "RESERVATION_CANNOT_BE_CANCELLED",
  "TEMPORARY_UNAVAILABLE",
]);

const ReserveBikeActionSuggestedActionSchema = z.enum([
  "choose_another_bike",
  "check_current_reservation",
  "top_up_wallet",
  "retry_later",
  "wait_until_operating_hours",
]);

const CancelReservationActionSuggestedActionSchema = z.enum([
  "check_current_reservation",
  "retry_later",
]);

const ReserveBikeActionFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: ReserveBikeActionFailureCodeSchema,
    kind: ActionFailureKindSchema,
    retryable: z.boolean(),
    suggestedAction: ReserveBikeActionSuggestedActionSchema,
    userMessage: z.string(),
  }).strict(),
}).strict();

const CancelReservationActionFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: CancelReservationActionFailureCodeSchema,
    kind: ActionFailureKindSchema,
    retryable: z.boolean(),
    suggestedAction: CancelReservationActionSuggestedActionSchema,
    userMessage: z.string(),
  }).strict(),
}).strict();

const ReservationActionSuccessSchema = z.object({
  bikeNumber: z.string().nullable(),
  createdAtDisplay: z.string().nullable(),
  endTimeDisplay: z.string().nullable(),
  prepaidDisplay: z.string().nullable(),
  reservation: ReservationDetailSchema,
  startTimeDisplay: z.string().nullable(),
  station: StationSummaryInfoSchema.nullable(),
  statusLabel: z.string(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const ReserveBikeActionSuccessSchema = z.object({
  ok: z.literal(true),
  reservation: ReservationActionSuccessSchema,
}).strict();

export const ReservationSummaryToolOutputSchema = z.object({
  latestPendingOrActive: ReservationSummaryItemSchema.nullable(),
  reservations: z.array(ReservationSummaryItemSchema),
}).strict();

export const ReservationDetailToolOutputSchema = z.object({
  reference: ReservationDetailReferenceSchema,
  detail: ReservationExpandedDetailToolSchema.nullable(),
}).strict();

export const ReserveBikeToolOutputSchema = ReserveBikeActionSuccessSchema.or(
  ReserveBikeActionFailureSchema,
);

export const CancelReservationToolOutputSchema = z.object({
  ok: z.literal(true),
  reservation: ReservationActionSuccessSchema,
}).strict().or(CancelReservationActionFailureSchema);
