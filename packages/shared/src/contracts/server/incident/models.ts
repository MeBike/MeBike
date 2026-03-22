import { z } from "../../../zod";
import {
  IncidentSeveritySchema,
  IncidentSourceSchema,
  IncidentStatusSchema,
} from "./schemas";

export const IncidentSummarySchema = z.object({
  id: z.uuidv7(),
  reporterUserId: z.uuidv7(),
  rentalId: z.uuidv7().nullable(),
  bikeId: z.uuidv7(),
  stationId: z.uuidv7().nullable(),
  source: IncidentSourceSchema,
  incidentType: z.string(),
  severity: IncidentSeveritySchema,
  description: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  bikeLocked: z.boolean(),
  status: IncidentStatusSchema,
  reportedAt: z.iso.datetime(),
  resolvedAt: z.iso.datetime().nullable(),
  closedAt: z.iso.datetime().nullable(),
});

export type IncidentDetail = z.infer<typeof IncidentSummarySchema>;
export type IncidentSummary = z.infer<typeof IncidentSummarySchema>;
