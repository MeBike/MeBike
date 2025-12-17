import { z } from "../../zod";

export const RatingDetailSchema = z.object({
  id: z.string(),
  rentalId: z.string(),
  userId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable(),
  reasonIds: z.array(z.string()).min(1),
  updatedAt: z.string(),
});

export type RatingDetail = z.infer<typeof RatingDetailSchema>;
