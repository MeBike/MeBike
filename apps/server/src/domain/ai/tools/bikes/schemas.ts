import { BikesContracts } from "@mebike/shared";
import { z } from "zod";

const BikeDetailReferenceSchema = z.enum(["id"]);

const BikeRentabilityReasonSchema = z.enum([
  "AVAILABLE",
  "BOOKED",
  "RESERVED",
  "BROKEN",
  "REDISTRIBUTING",
  "LOST",
  "DISABLED",
  "NO_STATION",
]);

export const BikeAiDetailSchema = z.object({
  createdAtDisplay: z.string().nullable(),
  id: z.uuidv7(),
  bikeNumber: z.string(),
  stationId: z.uuidv7().nullable(),
  status: BikesContracts.BikeStatusSchema,
  statusLabel: z.string(),
  isRentable: z.boolean(),
  rentabilityReason: BikeRentabilityReasonSchema,
  rentabilityLabel: z.string(),
  createdAt: z.string().datetime(),
  updatedAtDisplay: z.string().nullable(),
  updatedAt: z.string().datetime(),
}).strict();

export const BikeDetailToolOutputSchema = z.object({
  reference: BikeDetailReferenceSchema,
  detail: BikeAiDetailSchema.nullable(),
}).strict();
