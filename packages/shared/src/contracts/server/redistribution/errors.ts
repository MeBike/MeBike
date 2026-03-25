import { z } from "../../../zod";
import { ServerErrorDetailSchema } from "../schemas";

export const redistributionReqErrorCodes = [
  "REDISTRIBUTION_REQUEST_NOT_FOUND"
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

export const RedistributionRequestErrorResponseSchema = ServerErrorDetailSchema.extend({
  details: RedistributionReqErrorDetailSchema.optional(),
}).openapi("RedistributionRequestErrorResponse", {
  description: "Standard error payload for redistribution request endpoints"
})

export type RedistributionReqErrorCode = (typeof redistributionReqErrorCodes)[number];
export type RedistributionReqErrorDetail = z.infer<typeof RedistributionReqErrorDetailSchema>;
export type RedistributionReqErrorResponse = z.infer<typeof RedistributionRequestErrorResponseSchema>

export const stationErrorMessages: Record<RedistributionReqErrorCode, string> = {
  REDISTRIBUTION_REQUEST_NOT_FOUND: "Redistribution request not found"
};
