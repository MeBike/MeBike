import { z } from "../../../zod";

export const OperatorStationContextStationSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
}).openapi("OperatorStationContextStation");

export const OperatorStationContextResponseSchema = z.object({
  currentStation: OperatorStationContextStationSchema,
  otherStations: z.array(OperatorStationContextStationSchema),
}).openapi("OperatorStationContextResponse");

export const OperatorErrorCodeSchema = z.enum([
  "OPERATOR_STATION_NOT_FOUND",
]).openapi("OperatorErrorCode");

export const operatorErrorMessages = {
  OPERATOR_STATION_NOT_FOUND: "Operator station not found",
} as const;

export const OperatorErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: OperatorErrorCodeSchema,
    stationId: z.uuidv7().optional(),
  }),
}).openapi("OperatorErrorResponse");

export type OperatorStationContextStation = z.infer<typeof OperatorStationContextStationSchema>;
export type OperatorStationContextResponse = z.infer<typeof OperatorStationContextResponseSchema>;
export type OperatorErrorResponse = z.infer<typeof OperatorErrorResponseSchema>;
