import { z } from "../../../zod";

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

export const RentalErrorDetailSchema = z
  .object({
    code: RentalErrorCodeSchema,
    rentalId: z.string().optional(),
    bikeId: z.string().optional(),
    userId: z.string().optional(),
    stationId: z.string().optional(),
    sosId: z.string().optional(),
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
    startStationId: z.string().optional(),
    endStationId: z.string().optional(),
    fieldName: z.string().optional(),
    value: z.string().optional(),
    requestedStatus: z.string().optional(),
    requestedBikeStatus: z.string().optional(),
  })
  .openapi({
    description: "Rental-specific error detail",
    example: {
      code: "RENTAL_NOT_FOUND",
      rentalId: "665fd6e36b7e5d53f8f3d2c9",
    },
  });

export type RentalErrorCode = (typeof rentalErrorCodes)[number];
export type RentalErrorDetail = z.infer<typeof RentalErrorDetailSchema>;
