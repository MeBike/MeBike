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
  stationName: z.string().nullable(),
  stationAddress: z.string().nullable(),
  stationLatitude: z.number().nullable(),
  stationLongitude: z.number().nullable(),
  stationTotalCapacity: z.number().int().nullable(),
  stationPickupSlotLimit: z.number().int().nullable(),
  stationReturnSlotLimit: z.number().int().nullable(),
  status: AgencyRequestStatusSchema,
  description: z.string().nullable(),
  reviewedByUserId: z.uuidv7().nullable(),
  reviewedAt: z.iso.datetime().nullable(),
  approvedAgencyId: z.uuidv7().nullable(),
  createdAgencyUserId: z.uuidv7().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).openapi("AgencyRequest");

export const AgencyRequestActorRefSchema = z.object({
  id: z.uuidv7(),
  fullName: z.string(),
  email: z.string().email(),
}).openapi("AgencyRequestActorRef");

export const AgencyRequestAgencyRefSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
}).openapi("AgencyRequestAgencyRef");

export const AdminAgencyRequestListItemSchema = AgencyRequestSchema.extend({
  requesterUser: AgencyRequestActorRefSchema.nullable(),
  reviewedByUser: AgencyRequestActorRefSchema.nullable(),
  approvedAgency: AgencyRequestAgencyRefSchema.nullable(),
  createdAgencyUser: AgencyRequestActorRefSchema.nullable(),
}).openapi("AdminAgencyRequestListItem");

export type AgencyRequest = z.infer<typeof AgencyRequestSchema>;
export type AgencyRequestStatus = z.infer<typeof AgencyRequestStatusSchema>;
export type AgencyRequestActorRef = z.infer<typeof AgencyRequestActorRefSchema>;
export type AgencyRequestAgencyRef = z.infer<typeof AgencyRequestAgencyRefSchema>;
export type AdminAgencyRequestListItem = z.infer<typeof AdminAgencyRequestListItemSchema>;
