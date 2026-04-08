import { z } from "../../../zod";

import { AccountStatusSchema } from "../users";
import { StationTypeSchema } from "../stations";

export const AgencyStationSummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  stationType: StationTypeSchema,
});

export const AgencySummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  contactPhone: z.string().nullable(),
  status: AccountStatusSchema,
  station: AgencyStationSummarySchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).openapi("AgencySummary");

export type AgencySummary = z.infer<typeof AgencySummarySchema>;
