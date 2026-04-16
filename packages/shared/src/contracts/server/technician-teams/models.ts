import { z } from "../../../zod";

export const TechnicianTeamAvailabilitySchema = z.enum(["AVAILABLE", "UNAVAILABLE"]);

export const TechnicianTeamStationRefSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
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

export const TechnicianTeamAvailableOptionSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  stationId: z.uuidv7(),
});

export type TechnicianTeamSummary = z.infer<typeof TechnicianTeamSummarySchema>;
export type TechnicianTeamAvailableOption = z.infer<typeof TechnicianTeamAvailableOptionSchema>;
export type TechnicianTeamAvailability = z.infer<typeof TechnicianTeamAvailabilitySchema>;
