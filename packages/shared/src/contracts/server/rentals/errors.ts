import { z } from "../../../zod";
import { ServerErrorDetailSchema, ServerErrorResponseSchema } from "../schemas";

export const rentalErrorCodes = [
  // Access & Permission Errors
  "CANNOT_END_OTHER_RENTAL",
  "ACCESS_DENIED",
  "CANNOT_CREATE_RENTAL_WITH_SOS_STATUS",
  "CANNOT_END_RENTAL_WITH_SOS_STATUS",
  "CANNOT_REQUEST_SWAP_THIS_RENTAL_WITH_STATUS",
  "CANNOT_APPROVE_SWAP_THIS_RENTAL_WITH_STATUS",

  // Not Found Errors
  "RENTAL_NOT_FOUND",
  "NOT_FOUND_RENTED_RENTAL",
  "USER_NOT_FOUND",
  "BIKE_NOT_FOUND",
  "STATION_NOT_FOUND",
  "BIKE_NOT_FOUND_IN_STATION",
  "SOS_NOT_FOUND",

  // Bike Availability Errors
  "BIKE_IN_USE",
  "BIKE_IS_BROKEN",
  "BIKE_IS_MAINTAINED",
  "BIKE_IS_RESERVED",
  "UNAVAILABLE_BIKE",
  "NOT_AVAILABLE_BIKE",
  "NO_AVAILABLE_BIKE",
  "INVALID_BIKE_STATUS",

  // Payment & Wallet Errors
  "NOT_ENOUGH_BALANCE_TO_RENT",
  "USER_NOT_HAVE_WALLET",
  "SUBSCRIPTION_NOT_FOUND",
  "SUBSCRIPTION_NOT_USABLE",
  "SUBSCRIPTION_USAGE_EXCEEDED",

  // Time & Validation Errors
  "END_DATE_CANNOT_BE_IN_FUTURE",
  "END_TIME_MUST_GREATER_THAN_START_TIME",
  "INVALID_END_TIME_FORMAT",
  "INVALID_RENTAL_STATUS",
  "INVALID_OBJECT_ID",
  "OVERNIGHT_OPERATIONS_CLOSED",

  // Status Transition Errors
  "CANNOT_EDIT_THIS_RENTAL_WITH_STATUS",
  "CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS",
  "UPDATED_STATUS_NOT_ALLOWED",
  "CANNOT_CANCEL_WITH_BIKE_STATUS",
  "CANNOT_EDIT_BIKE_STATUS_TO",

  // Missing Required Data Errors
  "CANNOT_END_WITHOUT_END_STATION",
  "CANNOT_END_WITHOUT_END_TIME",
  "PROVIDE_AT_LEAST_ONE_UPDATED_FIELD_BESIDES_REASON",
  "RETURN_SLOT_REQUIRED_FOR_RETURN",
  "RETURN_SLOT_STATION_MISMATCH",
  "RETURN_SLOT_NOT_FOUND",
  "RETURN_SLOT_REQUIRES_ACTIVE_RENTAL",
  "BILLING_PREVIEW_REQUIRES_ACTIVE_RENTAL",
  "BILLING_DETAIL_REQUIRES_COMPLETED_RENTAL",
  "BILLING_DETAIL_NOT_READY",
  "RETURN_SLOT_CAPACITY_EXCEEDED",
  "RETURN_ALREADY_CONFIRMED",

  // Active Rental Errors
  "ACTIVE_RENTAL_EXISTS",

  // System & Update Errors
  "RENTAL_UPDATE_FAILED",
  "BIKE_UPDATE_FAILED",
  "BIKE_MISSING_STATION",
  "BIKE_NOT_AVAILABLE_FOR_RENTAL",
  "BIKE_SWAP_REQUEST_ALREADY_PENDING",
] as const;

export const bikeSwapRequestErrorCodes = [
  "BIKE_SWAP_REQUEST_NOT_FOUND",
  "NO_AVAILABLE_BIKE",
  "INVALID_BIKE_SWAP_REQUEST_STATUS",
] as const;

export const RentalErrorCodeSchema = z.enum(rentalErrorCodes);

export const BikeSwapRequestErrorCodeSchema = z.enum(bikeSwapRequestErrorCodes);

export const RentalErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: RentalErrorCodeSchema,
  rentalId: z.uuidv7().optional(),
  bikeId: z.uuidv7().optional(),
  userId: z.uuidv7().optional(),
  stationId: z.uuidv7().optional(),
  subscriptionId: z.uuidv7().optional(),
  sosId: z.uuidv7().optional(),
  cardUid: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  endTime: z.string().optional(),
  startTime: z.string().optional(),
  requiredBalance: z.number().optional(),
  currentBalance: z.number().optional(),
  status: z.string().optional(),
  bikeStatus: z.string().optional(),
  startStationId: z.uuidv7().optional(),
  endStationId: z.uuidv7().optional(),
  returnSlotStationId: z.uuidv7().optional(),
  fieldName: z.string().optional(),
  value: z.string().optional(),
  requestedStatus: z.string().optional(),
  requestedBikeStatus: z.string().optional(),
  usageCount: z.number().optional(),
  maxUsages: z.number().nullable().optional(),
  totalCapacity: z.number().optional(),
  returnSlotLimit: z.number().optional(),
  totalBikes: z.number().optional(),
  activeReturnSlots: z.number().optional(),
  currentTime: z.string().optional(),
  windowStart: z.string().optional(),
  windowEnd: z.string().optional(),
}).openapi({
  description: "Rental-specific error detail",
  example: {
    code: "RENTAL_NOT_FOUND",
    rentalId: "665fd6e36b7e5d53f8f3d2c9",
  },
});

export const BikeSwapRequestErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: BikeSwapRequestErrorCodeSchema,
  bikeSwapRequestId: z.uuidv7().optional(),
}).openapi({
  description: "Bike swap request-specific error detail",
  example: {
    code: "BIKE_SWAP_REQUEST_NOT_FOUND",
    bikeSwapRequestId: "665fd6e36b7e5d53f8f3d2c9",
  },
});

export const RentalErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: RentalErrorDetailSchema.optional(),
}).openapi("RentalErrorResponse", {
  description: "Standard error payload for rental endpoints",
});

export const BikeSwapRequestErrorResponseSchema
  = ServerErrorResponseSchema.extend({
    details: BikeSwapRequestErrorDetailSchema.optional(),
  }).openapi("BikeSwapRequestErrorResponse", {
    description: "Standard error payload for bike swap request endpoints",
  });

export type RentalErrorCode = (typeof rentalErrorCodes)[number];
export type RentalErrorDetail = z.infer<typeof RentalErrorDetailSchema>;
export type RentalErrorResponse = z.infer<typeof RentalErrorResponseSchema>;
export type BikeSwapRequestErrorCode
  = (typeof bikeSwapRequestErrorCodes)[number];
export type BikeSwapRequestErrorDetail = z.infer<
  typeof BikeSwapRequestErrorDetailSchema
>;
export type BikeSwapRequestErrorResponse = z.infer<
  typeof BikeSwapRequestErrorResponseSchema
>;

// Basic message map (feel free to localize downstream)
export const rentalErrorMessages: Record<RentalErrorCode, string> = {
  CANNOT_END_OTHER_RENTAL: "Cannot end another user's rental",
  ACCESS_DENIED: "Access denied",
  CANNOT_CREATE_RENTAL_WITH_SOS_STATUS:
    "Cannot create rental from SOS with this status",
  CANNOT_END_RENTAL_WITH_SOS_STATUS:
    "Cannot end rental from SOS with this status",
  CANNOT_REQUEST_SWAP_THIS_RENTAL_WITH_STATUS:
    "Cannot request bike swap in this status",
  CANNOT_APPROVE_SWAP_THIS_RENTAL_WITH_STATUS:
    "Cannot approve bike swap in this status",

  RENTAL_NOT_FOUND: "Rental not found",
  NOT_FOUND_RENTED_RENTAL: "No active rental found",
  USER_NOT_FOUND: "User not found",
  BIKE_NOT_FOUND: "Bike not found",
  STATION_NOT_FOUND: "Station not found",
  BIKE_NOT_FOUND_IN_STATION: "Bike not found in station",
  SOS_NOT_FOUND: "SOS request not found",

  BIKE_IN_USE: "Bike is already in use",
  BIKE_IS_BROKEN: "Bike is broken",
  BIKE_IS_MAINTAINED: "Bike is under maintenance",
  BIKE_IS_RESERVED: "Bike is reserved",
  UNAVAILABLE_BIKE: "Bike is unavailable",
  NOT_AVAILABLE_BIKE: "Bike is not available",
  NO_AVAILABLE_BIKE: "No available bike found for swap",
  INVALID_BIKE_STATUS: "Invalid bike status",

  NOT_ENOUGH_BALANCE_TO_RENT: "Insufficient balance to start rental",
  USER_NOT_HAVE_WALLET: "User does not have a wallet",
  SUBSCRIPTION_NOT_FOUND: "Subscription not found",
  SUBSCRIPTION_NOT_USABLE: "Subscription is not usable",
  SUBSCRIPTION_USAGE_EXCEEDED: "Subscription usage limit exceeded",

  END_DATE_CANNOT_BE_IN_FUTURE: "End date cannot be in the future",
  END_TIME_MUST_GREATER_THAN_START_TIME: "End time must be after start time",
  INVALID_END_TIME_FORMAT: "Invalid end time format",
  INVALID_RENTAL_STATUS: "Invalid rental status",
  INVALID_OBJECT_ID: "Invalid identifier",
  OVERNIGHT_OPERATIONS_CLOSED: "Operations are closed overnight",

  CANNOT_EDIT_THIS_RENTAL_WITH_STATUS: "Cannot edit rental in this status",
  CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS: "Cannot cancel rental in this status",
  UPDATED_STATUS_NOT_ALLOWED: "Requested status transition is not allowed",
  CANNOT_CANCEL_WITH_BIKE_STATUS: "Cannot cancel with current bike status",
  CANNOT_EDIT_BIKE_STATUS_TO: "Cannot edit bike status to requested value",

  CANNOT_END_WITHOUT_END_STATION: "End station is required",
  CANNOT_END_WITHOUT_END_TIME: "End time is required",
  PROVIDE_AT_LEAST_ONE_UPDATED_FIELD_BESIDES_REASON:
    "Provide at least one field to update",
  RETURN_SLOT_REQUIRED_FOR_RETURN: "An active return slot is required to end this rental",
  RETURN_SLOT_STATION_MISMATCH: "The rental can only end at the station reserved by the active return slot",
  RETURN_SLOT_NOT_FOUND: "Return slot not found",
  RETURN_SLOT_REQUIRES_ACTIVE_RENTAL: "Return slot requires an active rental",
  BILLING_PREVIEW_REQUIRES_ACTIVE_RENTAL: "Billing preview requires an active rental",
  BILLING_DETAIL_REQUIRES_COMPLETED_RENTAL: "Billing detail requires a completed rental",
  BILLING_DETAIL_NOT_READY: "Billing detail is not ready",
  RETURN_SLOT_CAPACITY_EXCEEDED: "Station does not have enough capacity for another return slot",
  RETURN_ALREADY_CONFIRMED: "Rental return has already been confirmed",

  ACTIVE_RENTAL_EXISTS: "Active rental already exists for this user",

  RENTAL_UPDATE_FAILED: "Rental update failed",
  BIKE_UPDATE_FAILED: "Bike update failed",
  BIKE_MISSING_STATION: "Bike is missing station information",
  BIKE_NOT_AVAILABLE_FOR_RENTAL: "Bike is not available for rental",
  BIKE_SWAP_REQUEST_ALREADY_PENDING: "A bike swap request is already pending for this rental",
};

export const bikeSwapRequestErrorMessages: Record<
  BikeSwapRequestErrorCode,
  string
> = {
  BIKE_SWAP_REQUEST_NOT_FOUND: "Bike swap request not found",
  NO_AVAILABLE_BIKE: "No available bike found for swap",
  INVALID_BIKE_SWAP_REQUEST_STATUS:
    "Bike swap request must be in PENDING status",
};
