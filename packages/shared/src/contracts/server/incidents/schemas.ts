import { z } from "../../../zod";

export const IncidentStatusSchema = z.enum([
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
]);

export const IncidentSeveritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const IncidentSourceSchema = z.enum([
  "DURING_RENTAL",
  "POST_RETURN",
  "STAFF_INSPECTION",
]);

export const AssignmentStatusSchema = z.enum([
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "RESOLVED",
  "CANCELLED",
]);

export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;
export type IncidentSource = z.infer<typeof IncidentSourceSchema>;
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;
