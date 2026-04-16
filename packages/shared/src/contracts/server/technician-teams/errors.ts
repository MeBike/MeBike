import { z } from "../../../zod";

export const TechnicianTeamErrorCodeSchema = z.enum([
  "TECHNICIAN_TEAM_INTERNAL_STATION_REQUIRED",
  "TECHNICIAN_TEAM_STATION_NOT_FOUND",
]);

export const technicianTeamErrorMessages = {
  TECHNICIAN_TEAM_INTERNAL_STATION_REQUIRED: "Technician teams require an internal station",
  TECHNICIAN_TEAM_STATION_NOT_FOUND: "Station not found for technician team",
} as const satisfies Record<z.infer<typeof TechnicianTeamErrorCodeSchema>, string>;

export const TechnicianTeamErrorDetailSchema = z.object({
  code: TechnicianTeamErrorCodeSchema,
  stationId: z.uuidv7().optional(),
  stationType: z.enum(["INTERNAL", "AGENCY"]).optional(),
});

export const TechnicianTeamErrorResponseSchema = z.object({
  error: z.string(),
  details: TechnicianTeamErrorDetailSchema,
});

export type TechnicianTeamErrorResponse = z.infer<typeof TechnicianTeamErrorResponseSchema>;
