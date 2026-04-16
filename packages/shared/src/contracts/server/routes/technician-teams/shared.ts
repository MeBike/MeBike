import { z } from "../../../../zod";

import {
  ServerErrorResponseSchema,
} from "../../schemas";
import {
  TechnicianTeamAvailabilitySchema,
  TechnicianTeamAvailableOptionSchema,
  TechnicianTeamErrorCodeSchema,
  TechnicianTeamErrorResponseSchema,
  TechnicianTeamSummarySchema,
} from "../../technician-teams";

export const TechnicianTeamListQuerySchema = z.object({
  stationId: z.uuidv7().optional(),
  availabilityStatus: TechnicianTeamAvailabilitySchema.optional(),
}).openapi("TechnicianTeamListQuery");

export const TechnicianTeamCreateBodySchema = z.object({
  name: z.string().trim().min(1),
  stationId: z.uuidv7(),
  availabilityStatus: TechnicianTeamAvailabilitySchema.optional(),
}).openapi("TechnicianTeamCreateBody", {
  example: {
    name: "Team Alpha",
    stationId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
    availabilityStatus: "AVAILABLE",
  },
});

export const TechnicianTeamListResponseSchema = z.object({
  data: z.array(TechnicianTeamSummarySchema),
}).openapi("TechnicianTeamListResponse");

export const TechnicianTeamAvailableListResponseSchema = z.object({
  data: z.array(TechnicianTeamAvailableOptionSchema),
}).openapi("TechnicianTeamAvailableListResponse");

export {
  ServerErrorResponseSchema,
  TechnicianTeamAvailabilitySchema,
  TechnicianTeamAvailableOptionSchema,
  TechnicianTeamErrorCodeSchema,
  TechnicianTeamErrorResponseSchema,
  TechnicianTeamSummarySchema,
};

export type TechnicianTeamListResponse = z.infer<typeof TechnicianTeamListResponseSchema>;
export type TechnicianTeamAvailableListResponse = z.infer<typeof TechnicianTeamAvailableListResponseSchema>;
