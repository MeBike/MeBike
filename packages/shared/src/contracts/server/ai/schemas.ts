import { z } from "../../../zod";
import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";

export const AiChatScreenSchema = z
  .enum(["rental", "reservation", "station", "bike", "wallet"])
  .openapi("AiChatScreen");

export const AiChatMessageSchema = z.object({
}).catchall(z.unknown()).openapi("AiChatMessage");

export const AiChatLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
}).openapi("AiChatLocation");

export const AiChatContextSchema = z.object({
  screen: AiChatScreenSchema.nullable().optional(),
  rentalId: z.string().nullable().optional(),
  reservationId: z.string().nullable().optional(),
  bikeId: z.string().nullable().optional(),
  stationId: z.string().nullable().optional(),
  stationName: z.string().nullable().optional(),
  location: AiChatLocationSchema.nullable().optional(),
}).openapi("AiChatContext");

export const AiChatRequestSchema = z.object({
  id: z.string().min(1).nullable().optional(),
  messages: z.array(AiChatMessageSchema).min(1),
  context: AiChatContextSchema.nullable().optional(),
}).openapi("AiChatRequest");

export const AiErrorCodeSchema = z
  .enum(["AI_INVALID_REQUEST", "AI_NOT_CONFIGURED", "AI_UNAVAILABLE"])
  .openapi("AiErrorCode");

export const aiErrorMessages = {
  AI_INVALID_REQUEST: "Invalid AI chat message payload",
  AI_NOT_CONFIGURED: "AI assistant is not configured",
  AI_UNAVAILABLE: "AI assistant is unavailable right now",
} as const;

export const AiErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: AiErrorCodeSchema,
    reason: z.string().optional(),
  }),
}).openapi("AiErrorResponse");

export const AiChatStreamResponseSchema = z
  .string()
  .openapi("AiChatStreamResponse");

export type AiChatContext = z.infer<typeof AiChatContextSchema>;
export type AiChatRequest = z.infer<typeof AiChatRequestSchema>;
export type AiErrorResponse = z.infer<typeof AiErrorResponseSchema>;

export {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
};
