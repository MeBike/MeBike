import { z } from "../../../zod";
import { ServerErrorDetailSchema } from "../schemas";

export const stationErrorCodes = [
  "STATION_NOT_FOUND",
  "STATION_NAME_ALREADY_EXISTS",
  "CAPACITY_LIMIT_EXCEEDED",
  "CAPACITY_SPLIT_INVALID",
  "CAPACITY_BELOW_ACTIVE_USAGE",
  "RETURN_SLOT_LIMIT_BELOW_ACTIVE_RESERVATIONS",
  "OUTSIDE_SUPPORTED_AREA",
  "STATION_AGENCY_REQUIRED",
  "STATION_AGENCY_FORBIDDEN",
  "STATION_AGENCY_NOT_FOUND",
  "STATION_AGENCY_ALREADY_ASSIGNED",
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
  agencyId: z.uuidv7().optional(),
  totalCapacity: z.number().int().nonnegative().optional(),
  returnSlotLimit: z.number().int().nonnegative().optional(),
  totalBikes: z.number().int().nonnegative().optional(),
  activeReturnSlots: z.number().int().nonnegative().optional(),
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
  CAPACITY_SPLIT_INVALID: "Station return slot limit is invalid for the configured capacity",
  CAPACITY_BELOW_ACTIVE_USAGE: "Station capacity cannot be lower than bikes and active return slots already assigned",
  RETURN_SLOT_LIMIT_BELOW_ACTIVE_RESERVATIONS: "Return slot limit cannot be lower than active return slots",
  OUTSIDE_SUPPORTED_AREA: "Coordinates are outside supported service area",
  STATION_AGENCY_REQUIRED: "Agency-owned stations must reference an agency",
  STATION_AGENCY_FORBIDDEN: "Internal stations cannot reference an agency",
  STATION_AGENCY_NOT_FOUND: "Agency not found for station ownership",
  STATION_AGENCY_ALREADY_ASSIGNED: "Agency is already assigned to another station",
  CANNOT_DELETE_STATION_WITH_BIKES: "Cannot delete station with bikes",
  NO_AVAILABLE_BIKE_FOUND: "No available bike found",
  INVALID_DATE_FORMAT: "Invalid date format",
  INVALID_DATE_RANGE: "Invalid date range",
  INVALID_QUERY_PARAMS: "Invalid query parameters",
  INVALID_COORDINATES: "Invalid coordinates",
};
