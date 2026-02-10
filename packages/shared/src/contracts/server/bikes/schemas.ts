import { z } from "../../../zod";

export const BikeStatusSchema = z.enum([
  "AVAILABLE",
  "BOOKED",
  "BROKEN",
  "RESERVED",
  "MAINTAINED",
  "UNAVAILABLE",
]);

export type BikeStatus = z.infer<typeof BikeStatusSchema>;
