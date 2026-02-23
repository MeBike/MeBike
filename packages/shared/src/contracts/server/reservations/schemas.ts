import { z } from "../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";
import {
  ReservationDetailSchema,
  ReservationOptionSchema,
  ReservationStatusSchema,
} from "./models";

export const ReservationErrorCodeSchema = z
  .enum([
    "ACTIVE_RESERVATION_EXISTS",
    "BIKE_ALREADY_RESERVED",
    "BIKE_NOT_FOUND",
    "BIKE_NOT_FOUND_IN_STATION",
    "BIKE_NOT_AVAILABLE",
    "RESERVATION_OPTION_NOT_SUPPORTED",
    "SUBSCRIPTION_REQUIRED",
    "SUBSCRIPTION_NOT_FOUND",
    "SUBSCRIPTION_NOT_USABLE",
    "SUBSCRIPTION_USAGE_EXCEEDED",
    "WALLET_NOT_FOUND",
    "INSUFFICIENT_WALLET_BALANCE",
    "RESERVATION_NOT_FOUND",
    "RESERVATION_NOT_OWNED",
    "RESERVATION_MISSING_BIKE",
    "INVALID_RESERVATION_TRANSITION",
    "RESERVED_RENTAL_NOT_FOUND",
  ])
  .openapi("ReservationErrorCode");

export const reservationErrorMessages = {
  ACTIVE_RESERVATION_EXISTS: "User already has an active reservation",
  BIKE_ALREADY_RESERVED: "Bike is already reserved",
  BIKE_NOT_FOUND: "Bike not found",
  BIKE_NOT_FOUND_IN_STATION: "Bike not found in station",
  BIKE_NOT_AVAILABLE: "Bike is not available",
  RESERVATION_OPTION_NOT_SUPPORTED: "Reservation option not supported",
  SUBSCRIPTION_REQUIRED: "Subscription is required",
  SUBSCRIPTION_NOT_FOUND: "Subscription not found",
  SUBSCRIPTION_NOT_USABLE: "Subscription is not usable",
  SUBSCRIPTION_USAGE_EXCEEDED: "Subscription usage exceeded",
  WALLET_NOT_FOUND: "Wallet not found",
  INSUFFICIENT_WALLET_BALANCE: "Insufficient wallet balance",
  RESERVATION_NOT_FOUND: "Reservation not found",
  RESERVATION_NOT_OWNED: "Reservation does not belong to user",
  RESERVATION_MISSING_BIKE: "Reservation missing bike assignment",
  INVALID_RESERVATION_TRANSITION: "Invalid reservation status transition",
  RESERVED_RENTAL_NOT_FOUND: "Reserved rental not found",
} as const;

export const ReservationErrorDetailSchema = z.object({
  code: ReservationErrorCodeSchema,
  reservationId: z.uuidv7().optional(),
  userId: z.uuidv7().optional(),
  bikeId: z.uuidv7().optional(),
  stationId: z.uuidv7().optional(),
  subscriptionId: z.uuidv7().optional(),
  option: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  usageCount: z.number().optional(),
  maxUsages: z.number().optional(),
  balance: z.number().optional(),
  attemptedDebit: z.number().optional(),
}).openapi("ReservationErrorDetail");

export const ReservationErrorResponseSchema = z.object({
  error: z.string(),
  details: ReservationErrorDetailSchema,
}).openapi("ReservationErrorResponse");

export const CreateReservationRequestSchema = z.object({
  bikeId: z.uuidv7(),
  stationId: z.uuidv7(),
  reservationOption: ReservationOptionSchema,
  subscriptionId: z.preprocess(
    value => (value === "" ? null : value),
    z.uuidv7().nullable().optional(),
  ),
  startTime: z.string().datetime({ offset: true }).optional(),
}).openapi("CreateReservationRequest");

export const ReservationDetailResponseSchema = ReservationDetailSchema.openapi("ReservationDetailResponse");

export const ListMyReservationsQuerySchema = z.object({
  ...paginationQueryFields,
  status: ReservationStatusSchema.optional(),
  stationId: z.uuidv7().optional(),
  reservationOption: ReservationOptionSchema.optional(),
}).openapi("ListMyReservationsQuery");

export const ListMyReservationsResponseSchema = z.object({
  data: ReservationDetailSchema.array(),
  pagination: PaginationSchema,
}).openapi("ListMyReservationsResponse");

export type ReservationErrorResponse = z.infer<typeof ReservationErrorResponseSchema>;
export type CreateReservationRequest = z.infer<typeof CreateReservationRequestSchema>;
export type ReservationDetailResponse = z.infer<typeof ReservationDetailResponseSchema>;
export type ListMyReservationsResponse = z.infer<typeof ListMyReservationsResponseSchema>;

export {
  ReservationDetailSchema,
  ReservationOptionSchema,
  ReservationStatusSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
};
