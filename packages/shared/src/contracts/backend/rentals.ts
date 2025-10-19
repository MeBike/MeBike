import { z } from "../../zod";

export const CardRentalRequestSchema = z.object({
  chip_id: z.string().min(1),
  card_uid: z.string().min(1),
});

export const CardRentalResponseSchema = z.object({
  message: z.string(),
  mode: z.enum(["started", "ended", "reservation_started"]),
  result: z.unknown(),
});

export type CardRentalRequest = z.infer<typeof CardRentalRequestSchema>;
export type CardRentalResponse = z.infer<typeof CardRentalResponseSchema>;
