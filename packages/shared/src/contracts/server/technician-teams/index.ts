import { z } from "../../../zod";

import { TechnicianTeamAvailableOptionSchema, TechnicianTeamSummarySchema } from "./models";

export * from "./errors";
export * from "./models";

export const TechnicianTeamListResponseSchema = z.object({
  data: z.array(TechnicianTeamSummarySchema),
});

export const TechnicianTeamAvailableListResponseSchema = z.object({
  data: z.array(TechnicianTeamAvailableOptionSchema),
});

export type TechnicianTeamListResponse = {
  data: z.infer<typeof TechnicianTeamSummarySchema>[];
};

export type TechnicianTeamAvailableListResponse = {
  data: z.infer<typeof TechnicianTeamAvailableOptionSchema>[];
};
