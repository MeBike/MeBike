import { z } from "../../../zod";
import { ServerErrorDetailSchema } from "../schemas";

export const redistributionReqErrorCodes = [
  // 404
  "REDISTRIBUTION_REQUEST_NOT_FOUND",
  "STATION_NOT_FOUND",
  "USER_NOT_FOUND",
  // 403
  "UNAUTHORIZED_ACCESS",
  "UNAUTHORIZED_REDISTRIBUTION_CREATION",
  // 400
  "INSUFFICIENT_AVAILABLE_BIKES",
  "INSUFFICIENT_EMPTY_SLOTS",
] as const;

export const RedistributionReqErrorCodeSchema = z.enum(redistributionReqErrorCodes);

export const RedistributionReqErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: RedistributionReqErrorCodeSchema,
  redistributionId: z.uuidv7().optional(),
  stationId: z.string().optional(),
  userId: z.string().optional(),
  required: z.number().optional(),
  available: z.number().optional(),
}).openapi({
  description: "Redistribution-specific error detail",
  example: {
    code: "REDISTRIBUTION_REQUEST_NOT_FOUND",
    redistributionId: "665fd6e36b7e5d53f8f3d2c9",
  },
});

export const RedistributionReqErrorResponseSchema = ServerErrorDetailSchema.extend({
  details: RedistributionReqErrorDetailSchema.optional(),
}).openapi("RedistributionRequestErrorResponse", {
  description: "Standard error payload for redistribution request endpoints"
})

export type RedistributionReqErrorCode = (typeof redistributionReqErrorCodes)[number];
export type RedistributionReqErrorDetail = z.infer<typeof RedistributionReqErrorDetailSchema>;
export type RedistributionReqErrorResponse = z.infer<typeof RedistributionReqErrorResponseSchema>

export const redistributionReqErrorMessages: Record<RedistributionReqErrorCode, string> = {
  // 404
  REDISTRIBUTION_REQUEST_NOT_FOUND: "Redistribution request not found",
  STATION_NOT_FOUND: "Station not found",
  USER_NOT_FOUND: "User not found",
  // 403
  UNAUTHORIZED_ACCESS: "You are not authorized to create a request for this station",
  UNAUTHORIZED_REDISTRIBUTION_CREATION: "You are not authorized to create a request for this station",
  // 400
  INSUFFICIENT_AVAILABLE_BIKES: "This station does not have enough bikes for distribution",
  INSUFFICIENT_EMPTY_SLOTS: "Target station does not have enough empty slots",
};
