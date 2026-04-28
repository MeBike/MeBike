import { z } from "../../../zod";
import { UserRoleSchema } from "../users/schemas";

export const TechnicianTeamAvailabilitySchema = z.enum(["AVAILABLE", "UNAVAILABLE"]);

export const TechnicianTeamStationRefSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
});

export const TechnicianTeamDetailStationSchema = TechnicianTeamStationRefSchema.extend({
  address: z.string(),
});

export const TechnicianTeamMemberSchema = z.object({
  userId: z.uuidv7(),
  fullName: z.string(),
  role: UserRoleSchema,
});

export const TechnicianTeamSummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  station: TechnicianTeamStationRefSchema,
  availabilityStatus: TechnicianTeamAvailabilitySchema,
  memberCount: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TechnicianTeamDetailSchema = TechnicianTeamSummarySchema.extend({
  station: TechnicianTeamDetailStationSchema,
  members: z.array(TechnicianTeamMemberSchema),
});

export const TechnicianTeamAvailableOptionSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  stationId: z.uuidv7(),
});

export type TechnicianTeamSummary = z.infer<typeof TechnicianTeamSummarySchema>;
export type TechnicianTeamDetail = z.infer<typeof TechnicianTeamDetailSchema>;
export type TechnicianTeamMember = z.infer<typeof TechnicianTeamMemberSchema>;
export type TechnicianTeamAvailableOption = z.infer<typeof TechnicianTeamAvailableOptionSchema>;
export type TechnicianTeamAvailability = z.infer<typeof TechnicianTeamAvailabilitySchema>;
