import { z } from "../../../zod";
import { ServerErrorDetailSchema, ServerErrorResponseSchema } from "../schemas";

export const bikeErrorCodes = [
  "BIKE_NOT_FOUND",
  "DUPLICATE_CHIP_ID",
  "INVALID_BIKE_STATUS",
  "BIKE_CURRENTLY_RENTED",
  "BIKE_CURRENTLY_RESERVED",
  "BIKE_NOT_RENTED_BY_USER",
] as const;

export const BikeErrorCodeSchema = z.enum(bikeErrorCodes);

export const BikeErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: BikeErrorCodeSchema,
  bikeId: z.string().optional(),
  chipId: z.string().optional(),
  status: z.string().optional(),
}).openapi({
  description: "Bike-specific error detail",
  example: {
    code: "BIKE_NOT_FOUND",
    bikeId: "665fd6e36b7e5d53f8f3d2c9",
  },
});

// Status-focused subsets for clearer OpenAPI docs
export const BikeNotFoundCodeSchema = z.enum(["BIKE_NOT_FOUND"]);
export const BikeUpdateConflictCodeSchema = z.enum([
  "BIKE_CURRENTLY_RENTED",
  "BIKE_CURRENTLY_RESERVED",
  "DUPLICATE_CHIP_ID",
  "INVALID_BIKE_STATUS",
]);
export const BikeReportForbiddenCodeSchema = z.enum(["BIKE_NOT_RENTED_BY_USER"]);

export type BikeErrorCode = (typeof bikeErrorCodes)[number];
export type BikeErrorDetail = z.infer<typeof BikeErrorDetailSchema>;
export type BikeErrorResponse = {
  error: string;
  details?: BikeErrorDetail;
};

export const BikeNotFoundResponseSchema = ServerErrorResponseSchema.extend({
  details: BikeErrorDetailSchema.extend({
    code: BikeNotFoundCodeSchema,
  }).optional(),
}).openapi("BikeNotFoundResponse", {
  description: "Bike not found response",
  example: {
    error: "Bike not found",
    details: {
      code: "BIKE_NOT_FOUND",
      bikeId: "665fd6e36b7e5d53f8f3d2c9",
    },
  },
});

export const BikeUpdateConflictResponseSchema = ServerErrorResponseSchema.extend({
  details: BikeErrorDetailSchema.extend({
    code: BikeUpdateConflictCodeSchema,
  }).optional(),
}).openapi("BikeUpdateConflictResponse", {
  description: "Bike update/delete conflict response",
  example: {
    error: "Bike update blocked",
    details: {
      code: "BIKE_CURRENTLY_RENTED",
      bikeId: "665fd6e36b7e5d53f8f3d2c9",
    },
  },
});

export const BikeReportForbiddenResponseSchema = ServerErrorResponseSchema.extend({
  details: BikeErrorDetailSchema.extend({
    code: BikeReportForbiddenCodeSchema,
  }).optional(),
}).openapi("BikeReportForbiddenResponse", {
  description: "Bike report broken forbidden response",
  example: {
    error: "Permission denied",
    details: {
      code: "BIKE_NOT_RENTED_BY_USER",
      bikeId: "665fd6e36b7e5d53f8f3d2c9",
    },
  },
});

export type BikeNotFoundResponse = z.infer<typeof BikeNotFoundResponseSchema>;
export type BikeUpdateConflictResponse = z.infer<typeof BikeUpdateConflictResponseSchema>;
export type BikeReportForbiddenResponse = z.infer<typeof BikeReportForbiddenResponseSchema>;

export const bikeErrorMessages: Record<BikeErrorCode, string> = {
  BIKE_NOT_FOUND: "Bike not found",
  DUPLICATE_CHIP_ID: "Chip ID already exists",
  INVALID_BIKE_STATUS: "Invalid bike status transition",
  BIKE_CURRENTLY_RENTED: "Bike is currently rented and cannot be modified/deleted",
  BIKE_CURRENTLY_RESERVED: "Bike is currently reserved and cannot be modified/deleted",
  BIKE_NOT_RENTED_BY_USER: "User is not currently renting this bike",
};
