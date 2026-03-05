import { z } from "../../../zod";

export const RatingDetailSchema = z.object({
  id: z.uuidv7(),
  rentalId: z.uuidv7(),
  userId: z.uuidv7(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable(),
  reasonIds: z.array(z.uuidv7()).min(1),
  updatedAt: z.string(),
});

export const RatingReasonSchema = z.object({
  id: z.uuidv7(),
  type: z.enum(["ISSUE", "COMPLIMENT"]),
  appliesTo: z.enum(["bike", "station", "app"]),
  messages: z.string(),
});

export type RatingDetail = z.infer<typeof RatingDetailSchema>;
export type RatingReason = z.infer<typeof RatingReasonSchema>;
