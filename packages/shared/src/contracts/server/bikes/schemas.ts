import { z } from "../../../zod";

export const BikeStatusSchema = z.enum([
  "AVAILABLE",
  "BOOKED",
  "BROKEN",
  "RESERVED",
  "REDISTRIBUTING",
  "DISABLED",
]);

export type BikeStatus = z.infer<typeof BikeStatusSchema>;
