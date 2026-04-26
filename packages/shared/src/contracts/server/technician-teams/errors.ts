import { z } from "../../../zod";

export const TechnicianTeamErrorCodeSchema = z.enum([
  "TECHNICIAN_TEAM_INTERNAL_STATION_REQUIRED",
  "TECHNICIAN_TEAM_STATION_ALREADY_ASSIGNED",
  "TECHNICIAN_TEAM_NOT_FOUND",
  "TECHNICIAN_TEAM_STATION_NOT_FOUND",
]);

export const technicianTeamErrorMessages = {
  TECHNICIAN_TEAM_INTERNAL_STATION_REQUIRED: "Technician teams require an internal station",
  TECHNICIAN_TEAM_STATION_ALREADY_ASSIGNED: "Station already has a technician team assigned",
  TECHNICIAN_TEAM_NOT_FOUND: "Technician team not found",
  TECHNICIAN_TEAM_STATION_NOT_FOUND: "Station not found for technician team",
} as const satisfies Record<z.infer<typeof TechnicianTeamErrorCodeSchema>, string>;

export const TechnicianTeamErrorDetailSchema = z.object({
  code: TechnicianTeamErrorCodeSchema,
  stationId: z.uuidv7().optional(),
  stationType: z.enum(["INTERNAL", "AGENCY"]).optional(),
  teamId: z.uuidv7().optional(),
});

export const TechnicianTeamErrorResponseSchema = z.object({
  error: z.string(),
  details: TechnicianTeamErrorDetailSchema,
});

export type TechnicianTeamErrorResponse = z.infer<typeof TechnicianTeamErrorResponseSchema>;
