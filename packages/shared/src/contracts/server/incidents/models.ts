import { z } from "../../../zod";
import { RentalStatusSchema } from "../rentals";
import {
  AssignmentStatusSchema,
  IncidentSeveritySchema,
  IncidentSourceSchema,
  IncidentStatusSchema,
} from "./schemas";

export const IncidentSummarySchema = z.object({
  id: z.string().uuid(),
  reporterUserId: z.string().uuid(),
  rentalId: z.string().uuid().nullable(),
  bikeId: z.string().uuid(),
  stationId: z.string().uuid().nullable(),
  source: IncidentSourceSchema,
  incidentType: z.string(),
  severity: IncidentSeveritySchema,
  description: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  bikeLocked: z.boolean(),
  status: IncidentStatusSchema,
  reportedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
  closedAt: z.string().datetime().nullable(),
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
      status: RentalStatusSchema,
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
      status: AssignmentStatusSchema,
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
      distanceMeters: z.number().nullable(),
      durationSeconds: z.number().nullable(),
      routeGeometry: z.string().nullable(),
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

export const TechnicianAssignmentSummarySchema = z.object({
  id: z.string().uuid(),
  incidentReportId: z.string().uuid().nullable(),
  technicianTeamId: z.string().uuid().nullable(),
  technicianUserId: z.string().uuid().nullable(),
  assignedByUserId: z.string().uuid().nullable(),
  distanceMeters: z.number().nullable(),
  durationSeconds: z.number().nullable(),
  routeGeometry: z.string().nullable(),
  assignedAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
  startedAt: z.string().datetime().nullable(),
  resolvedAt: z.string().datetime().nullable(),
  status: AssignmentStatusSchema,
});

export type IncidentDetail = z.infer<typeof IncidentDetailSchema>;
export type IncidentSummary = z.infer<typeof IncidentSummarySchema>;
export type TechnicianAssignmentSummary = z.infer<
  typeof TechnicianAssignmentSummarySchema
>;
