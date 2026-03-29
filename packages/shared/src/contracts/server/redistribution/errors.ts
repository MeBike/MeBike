import { z } from "../../../zod";
import { ServerErrorDetailSchema } from "../schemas";

export const redistributionReqErrorCodes = [
  // 404
  "REDISTRIBUTION_REQUEST_NOT_FOUND",
  // 400
  "INSUFFICIENT_AVAILABLE_BIKES"
] as const;

export const RedistributionReqErrorCodeSchema = z.enum(redistributionReqErrorCodes);

export const RedistributionReqErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: RedistributionReqErrorCodeSchema,
  redistributionId: z.uuidv7().optional(),
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
  // 400
  INSUFFICIENT_AVAILABLE_BIKES: "This station does not have enough bikes for distribution"
};
