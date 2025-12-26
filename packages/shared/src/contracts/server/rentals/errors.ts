import { z } from "../../../zod";
import { ServerErrorDetailSchema, ServerErrorResponseSchema } from "../schemas";

export const rentalErrorCodes = [
  // Access & Permission Errors
  "CANNOT_END_OTHER_RENTAL",
  "ACCESS_DENIED",
  "CANNOT_CREATE_RENTAL_WITH_SOS_STATUS",
  "CANNOT_END_RENTAL_WITH_SOS_STATUS",

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
  "INVALID_BIKE_STATUS",

  // Payment & Wallet Errors
  "NOT_ENOUGH_BALANCE_TO_RENT",
  "USER_NOT_HAVE_WALLET",

  // Time & Validation Errors
  "END_DATE_CANNOT_BE_IN_FUTURE",
  "END_TIME_MUST_GREATER_THAN_START_TIME",
  "INVALID_END_TIME_FORMAT",
  "INVALID_RENTAL_STATUS",
  "INVALID_OBJECT_ID",

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
  "MUST_END_AT_START_STATION",

  // Card Tap Rental Errors
  "CARD_RENTAL_ACTIVE_EXISTS",

  // System & Update Errors
  "RENTAL_UPDATE_FAILED",
  "BIKE_UPDATE_FAILED",

  // Card Tap Specific Errors
  "USER_NOT_FOUND_FOR_CARD",
  "BIKE_NOT_FOUND_FOR_CHIP",
  "BIKE_MISSING_STATION",
  "BIKE_NOT_AVAILABLE_FOR_RENTAL",
] as const;

export const RentalErrorCodeSchema = z.enum(rentalErrorCodes);

export const RentalErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: RentalErrorCodeSchema,
  rentalId: z.uuidv7().optional(),
  bikeId: z.uuidv7().optional(),
  userId: z.uuidv7().optional(),
  stationId: z.uuidv7().optional(),
  sosId: z.uuidv7().optional(),
  cardUid: z.string().optional(),
  chipId: z.string().optional(),
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
  fieldName: z.string().optional(),
  value: z.string().optional(),
  requestedStatus: z.string().optional(),
  requestedBikeStatus: z.string().optional(),
}).openapi({
  description: "Rental-specific error detail",
  example: {
    code: "RENTAL_NOT_FOUND",
    rentalId: "665fd6e36b7e5d53f8f3d2c9",
  },
});

export const RentalErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: RentalErrorDetailSchema.optional(),
}).openapi("RentalErrorResponse", {
  description: "Standard error payload for rental endpoints",
});

export type RentalErrorCode = (typeof rentalErrorCodes)[number];
export type RentalErrorDetail = z.infer<typeof RentalErrorDetailSchema>;
export type RentalErrorResponse = z.infer<typeof RentalErrorResponseSchema>;

// Basic message map (feel free to localize downstream)
export const rentalErrorMessages: Record<RentalErrorCode, string> = {
  CANNOT_END_OTHER_RENTAL: "Cannot end another user's rental",
  ACCESS_DENIED: "Access denied",
  CANNOT_CREATE_RENTAL_WITH_SOS_STATUS: "Cannot create rental from SOS with this status",
  CANNOT_END_RENTAL_WITH_SOS_STATUS: "Cannot end rental from SOS with this status",

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
  INVALID_BIKE_STATUS: "Invalid bike status",

  NOT_ENOUGH_BALANCE_TO_RENT: "Insufficient balance to start rental",
  USER_NOT_HAVE_WALLET: "User does not have a wallet",

  END_DATE_CANNOT_BE_IN_FUTURE: "End date cannot be in the future",
  END_TIME_MUST_GREATER_THAN_START_TIME: "End time must be after start time",
  INVALID_END_TIME_FORMAT: "Invalid end time format",
  INVALID_RENTAL_STATUS: "Invalid rental status",
  INVALID_OBJECT_ID: "Invalid identifier",

  CANNOT_EDIT_THIS_RENTAL_WITH_STATUS: "Cannot edit rental in this status",
  CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS: "Cannot cancel rental in this status",
  UPDATED_STATUS_NOT_ALLOWED: "Requested status transition is not allowed",
  CANNOT_CANCEL_WITH_BIKE_STATUS: "Cannot cancel with current bike status",
  CANNOT_EDIT_BIKE_STATUS_TO: "Cannot edit bike status to requested value",

  CANNOT_END_WITHOUT_END_STATION: "End station is required",
  CANNOT_END_WITHOUT_END_TIME: "End time is required",
  PROVIDE_AT_LEAST_ONE_UPDATED_FIELD_BESIDES_REASON: "Provide at least one field to update",
  MUST_END_AT_START_STATION: "Must end at the start station",

  CARD_RENTAL_ACTIVE_EXISTS: "Active rental already exists for this card",

  RENTAL_UPDATE_FAILED: "Rental update failed",
  BIKE_UPDATE_FAILED: "Bike update failed",

  USER_NOT_FOUND_FOR_CARD: "User not found for the provided card",
  BIKE_NOT_FOUND_FOR_CHIP: "Bike not found for the provided chip",
  BIKE_MISSING_STATION: "Bike is missing station information",
  BIKE_NOT_AVAILABLE_FOR_RENTAL: "Bike is not available for rental",
};
