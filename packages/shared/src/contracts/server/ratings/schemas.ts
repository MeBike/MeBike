import { z } from "../../../zod";
import { RatingDetailSchema, RatingReasonSchema } from "./models";

export const RatingErrorCodeSchema = z.enum([
  "RENTAL_NOT_FOUND",
  "UNAUTHORIZED_RENTAL_ACCESS",
  "RENTAL_NOT_COMPLETED",
  "RATING_EXPIRED",
  "RATING_ALREADY_EXISTS",
  "RATING_REASON_NOT_FOUND",
]).openapi("RatingErrorCode");

export const ratingErrorMessages = {
  RENTAL_NOT_FOUND: "Rental not found",
  UNAUTHORIZED_RENTAL_ACCESS: "You are not allowed to rate this rental",
  RENTAL_NOT_COMPLETED: "Rental is not completed",
  RATING_EXPIRED: "Rating window has expired",
  RATING_ALREADY_EXISTS: "Rating already exists for this rental",
  RATING_REASON_NOT_FOUND: "One or more rating reasons were not found",
} as const;

export const CreateRatingRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  reasonIds: z.array(z.uuidv7()).min(1),
  comment: z.string().max(500).optional().nullable(),
}).openapi("CreateRatingRequest");

export const CreateRatingResponseSchema = RatingDetailSchema.openapi("CreateRatingResponse");

export const RatingResponseSchema = CreateRatingResponseSchema;

export const RatingReasonsResponseSchema = z.array(RatingReasonSchema).openapi("RatingReasonsResponse");

export const RatingErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: RatingErrorCodeSchema,
  }).passthrough(),
}).openapi("RatingErrorResponse");

export { RatingDetailSchema } from "./models";

export type CreateRatingResponse = z.infer<typeof CreateRatingResponseSchema>;
export type RatingResponse = z.infer<typeof RatingResponseSchema>;
export type RatingReasonsResponse = z.infer<typeof RatingReasonsResponseSchema>;
export type RatingErrorCode = z.infer<typeof RatingErrorCodeSchema>;
export type RatingErrorResponse = z.infer<typeof RatingErrorResponseSchema>;
export type CreateRatingRequest = z.infer<typeof CreateRatingRequestSchema>;
