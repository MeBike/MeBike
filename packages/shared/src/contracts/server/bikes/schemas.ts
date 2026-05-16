import { z } from "../../../zod";

export const BikeStatusSchema = z.enum([
  "AVAILABLE",
  "BOOKED",
  "BROKEN",
  "FIXED",
  "RESERVED",
  "PENDING_DISPATCH",
  "TRANSPORTING",
  "SWAPPING",
  "LOST",
  "DISABLED",
]);

export type BikeStatus = z.infer<typeof BikeStatusSchema>;
