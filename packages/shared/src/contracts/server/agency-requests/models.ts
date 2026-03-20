import { z } from "../../../zod";

export const AgencyRequestStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]).openapi("AgencyRequestStatus");

export const AgencyRequestSchema = z.object({
  id: z.uuidv7(),
  requesterUserId: z.uuidv7().nullable(),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().nullable(),
  agencyName: z.string(),
  agencyAddress: z.string().nullable(),
  agencyContactPhone: z.string().nullable(),
  status: AgencyRequestStatusSchema,
  description: z.string().nullable(),
  reviewedByUserId: z.uuidv7().nullable(),
  reviewedAt: z.iso.datetime().nullable(),
  approvedAgencyId: z.uuidv7().nullable(),
  createdAgencyUserId: z.uuidv7().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).openapi("AgencyRequest");

export type AgencyRequest = z.infer<typeof AgencyRequestSchema>;
export type AgencyRequestStatus = z.infer<typeof AgencyRequestStatusSchema>;
