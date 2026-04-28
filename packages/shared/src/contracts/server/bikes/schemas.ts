import { z } from "../../../zod";

export const BikeStatusSchema = z.enum([
  "AVAILABLE",
  "BOOKED",
  "BROKEN",
  "RESERVED",
  "REDISTRIBUTING",
  "LOST",
  "DISABLED",
]);

export type BikeStatus = z.infer<typeof BikeStatusSchema>;
