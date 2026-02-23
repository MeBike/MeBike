import { z } from "../../../zod";
import { ServerErrorDetailSchema } from "../schemas";

export const stationErrorCodes = [
  "STATION_NOT_FOUND",
  "STATION_NAME_ALREADY_EXISTS",
  "CAPACITY_LIMIT_EXCEEDED",
  "OUTSIDE_SUPPORTED_AREA",
  "CANNOT_DELETE_STATION_WITH_BIKES",
  "NO_AVAILABLE_BIKE_FOUND",
  "INVALID_DATE_FORMAT",
  "INVALID_DATE_RANGE",
  "INVALID_QUERY_PARAMS",
  "INVALID_COORDINATES",
] as const;

export const StationErrorCodeSchema = z.enum(stationErrorCodes);

export const StationErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: StationErrorCodeSchema,
  stationId: z.uuidv7().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
}).openapi({
  description: "Station-specific error detail",
  example: {
    code: "STATION_NOT_FOUND",
    stationId: "665fd6e36b7e5d53f8f3d2c9",
  },
});

export type StationErrorCode = (typeof stationErrorCodes)[number];
export type StationErrorDetail = z.infer<typeof StationErrorDetailSchema>;
export type StationErrorResponse = {
  error: string;
  details?: StationErrorDetail;
};

export const stationErrorMessages: Record<StationErrorCode, string> = {
  STATION_NOT_FOUND: "Station not found",
  STATION_NAME_ALREADY_EXISTS: "Station name already exists",
  CAPACITY_LIMIT_EXCEEDED: "Station capacity exceeds configured limit",
  OUTSIDE_SUPPORTED_AREA: "Coordinates are outside supported service area",
  CANNOT_DELETE_STATION_WITH_BIKES: "Cannot delete station with bikes",
  NO_AVAILABLE_BIKE_FOUND: "No available bike found",
  INVALID_DATE_FORMAT: "Invalid date format",
  INVALID_DATE_RANGE: "Invalid date range",
  INVALID_QUERY_PARAMS: "Invalid query parameters",
  INVALID_COORDINATES: "Invalid coordinates",
};
