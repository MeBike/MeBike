import { z } from "../../../zod";
import { RatingDetailSchema } from "./models";

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
  reasonIds: z.array(z.string()).min(1),
  comment: z.string().max(500).optional().nullable(),
}).openapi("CreateRatingRequest");

export const CreateRatingResponseSchema = z.object({
  data: RatingDetailSchema,
}).openapi("CreateRatingResponse");

export const RatingResponseSchema = CreateRatingResponseSchema;

export { RatingDetailSchema } from "./models";

export type CreateRatingResponse = z.infer<typeof CreateRatingResponseSchema>;
export type RatingResponse = z.infer<typeof RatingResponseSchema>;
export type RatingErrorResponse = {
  error: string;
  details: {
    code: z.infer<typeof RatingErrorCodeSchema>;
  };
};
