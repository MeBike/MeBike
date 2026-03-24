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
  reportedAt: z.iso.date(),
  resolvedAt: z.iso.date().nullable(),
  closedAt: z.iso.date().nullable(),
});

export const IncidentDetailSchema = z.object({
  id: z.uuidv7(),
  reporterUser: z.object({
    id: z.uuidv7(),
    fullName: z.string(),
    phoneNumber: z.string().nullable(),
  }),
  rental: z
    .object({
      id: z.uuidv7(),
      status: z.string(),
    })
    .nullable(),
  bike: z.object({
    id: z.uuidv7(),
    chipId: z.string(),
  }),
  station: z
    .object({
      id: z.uuidv7(),
      name: z.string(),
      address: z.string(),
    })
    .nullable(),
  assignments: z
    .object({
      id: z.uuidv7(),
      status: z.string(),
      technician: z
        .object({
          id: z.uuidv7(),
          fullName: z.string(),
        })
        .nullable(),
      team: z
        .object({
          id: z.uuidv7(),
          name: z.string(),
        })
        .nullable(),
      assignedAt: z.coerce.date(),
    })
    .nullable(),
  source: IncidentSourceSchema,
  incidentType: z.string(),
  severity: IncidentSeveritySchema,
  description: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  bikeLocked: z.boolean(),
  status: IncidentStatusSchema,
  reportedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
  closedAt: z.coerce.date().nullable(),
});

export type IncidentDetail = z.infer<typeof IncidentDetailSchema>;
export type IncidentSummary = z.infer<typeof IncidentSummarySchema>;
