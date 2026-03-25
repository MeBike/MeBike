import { z } from "../../../zod";
import { ServerErrorDetailSchema, ServerErrorResponseSchema } from "../schemas";

export const incidentErrorCodes = [
  "INCIDENT_NOT_FOUND",
  "INVALID_INCIDENT_STATUS",
  "INVALID_QUERY_PARAMS",
  "RENTAL_NOT_FOUND",
  "BIKE_NOT_FOUND",
  "STATION_NOT_FOUND",
  "NO_NEAREST_STATION_FOUND",
  "BIKE_NOT_AVAILABLE",
  "NO_AVAILABLE_TECHNICIAN_FOUND",
  "UNAUTHORIZED_INCIDENT_ACCESS",
] as const;

export const IncidentErrorCodeSchema = z.enum(incidentErrorCodes);

export const IncidentErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: IncidentErrorCodeSchema,
  incidentId: z.uuidv7().optional(),
  status: z.string().optional(),
  stationId: z.uuidv7().optional(),
}).openapi({
  description: "Incident-specific error detail",
  example: {
    code: "INCIDENT_NOT_FOUND",
    incidentId: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
  },
});

export type IncidentErrorCode = (typeof incidentErrorCodes)[number];
export type IncidentErrorDetail = z.infer<typeof IncidentErrorDetailSchema>;
export type IncidentErrorResponse = {
  error: string;
  details?: IncidentErrorDetail;
};

export const IncidentNotFoundResponseSchema = ServerErrorResponseSchema.extend({
  details: IncidentErrorDetailSchema.extend({
    code: IncidentErrorCodeSchema,
  }).optional(),
}).openapi("IncidentNotFoundResponse", {
  description: "Incident not found response",
  example: {
    error: "Incident not found",
    details: {
      code: "INCIDENT_NOT_FOUND",
      incidentId: "665fd6e36b7e5d53f8f3d2c9",
    },
  },
});

export type IncidentNotFoundResponse = z.infer<
  typeof IncidentNotFoundResponseSchema
>;

export const IncidentErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: IncidentErrorDetailSchema.optional(),
}).openapi("IncidentErrorResponse", {
  description: "Standard error payload for incident endpoints",
});

export const incidentErrorMessages: Record<IncidentErrorCode, string> = {
  INCIDENT_NOT_FOUND: "Incident not found",
  INVALID_INCIDENT_STATUS: "Invalid incident status",
  INVALID_QUERY_PARAMS: "Invalid query parameters",
  RENTAL_NOT_FOUND: "Rental not found",
  BIKE_NOT_FOUND: "Bike not found",
  STATION_NOT_FOUND: "Station not found",
  NO_NEAREST_STATION_FOUND: "No nearest station found",
  BIKE_NOT_AVAILABLE: "Bike not available",
  NO_AVAILABLE_TECHNICIAN_FOUND: "No available technician found",
  UNAUTHORIZED_INCIDENT_ACCESS: "Unauthorized incident access",
};
