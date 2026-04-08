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
  "UNAUTHORIZED_REDISTRIBUTION_CANCELLATION",
  "UNAUTHORIZED_REDISTRIBUTION_APPROVAL",
  "UNAUTHORIZED_REDISTRIBUTION_REJECTION",
  "UNAUTHORIZED_START_TRANSITION",
  "UNAUTHORIZED_COMPLETED_REDISTRIBUTION_CONFIRMATION",
  // 400
  "INSUFFICIENT_AVAILABLE_BIKES",
  "INSUFFICIENT_EMPTY_SLOTS",
  "EXCEEDED_MIN_BIKES_AT_STATION",
  "CANNOT_CANCEL_NON_PENDING_REDISTRIBUTION",
  "CANNOT_APPROVE_NON_PENDING_REDISTRIBUTION",
  "CANNOT_REJECT_NON_PENDING_REDISTRIBUTION",
  "CANNOT_START_TRANSIT_NON_APPROVED_REDISTRIBUTION",
  "CANNOT_COMPLETE_NON_TRANSIT_OR_PARTIALLY_COMPLETED_REDISTRIBUTION",
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
  UNAUTHORIZED_ACCESS: "You are not authorized to access this redistribution request",
  UNAUTHORIZED_REDISTRIBUTION_CREATION: "You are not authorized to create a request for this station",
  UNAUTHORIZED_REDISTRIBUTION_CANCELLATION: "You are not authorized to cancel this redistribution request",
  UNAUTHORIZED_REDISTRIBUTION_APPROVAL: "You are not authorized to approve this redistribution request",
  UNAUTHORIZED_REDISTRIBUTION_REJECTION: "You are not authorized to reject this redistribution request",
  UNAUTHORIZED_START_TRANSITION: "You are not authorized to start the transition of this redistribution request",
  UNAUTHORIZED_COMPLETED_REDISTRIBUTION_CONFIRMATION: "You are not authorized to confirm the completion of this redistribution request",
  // 400
  INSUFFICIENT_AVAILABLE_BIKES: "This station does not have enough bikes for distribution",
  INSUFFICIENT_EMPTY_SLOTS: "Target station does not have enough empty slots",
  EXCEEDED_MIN_BIKES_AT_STATION: "Source station will have less than minimum bikes after redistribution",
  CANNOT_CANCEL_NON_PENDING_REDISTRIBUTION: "Cannot cancel redistribution request that is not in pending state",
  CANNOT_APPROVE_NON_PENDING_REDISTRIBUTION: "Cannot approve redistribution request that is not in pending state",
  CANNOT_REJECT_NON_PENDING_REDISTRIBUTION: "Cannot reject redistribution request that is not in pending state",
  CANNOT_START_TRANSIT_NON_APPROVED_REDISTRIBUTION: "Cannot start the transition of this redistribution request that is not in approved state",
  CANNOT_COMPLETE_NON_TRANSIT_OR_PARTIALLY_COMPLETED_REDISTRIBUTION: "Cannot complete redistribution request that is not in transit or partially completed state",
};
