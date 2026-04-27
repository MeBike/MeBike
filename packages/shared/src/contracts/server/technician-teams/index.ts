import { z } from "../../../zod";
import {
  TechnicianTeamAvailableOptionSchema,
  TechnicianTeamDetailSchema,
  TechnicianTeamSummarySchema,
} from "./models";

export * from "./errors";
export * from "./models";

export const TechnicianTeamListResponseSchema = z.object({
  data: z.array(TechnicianTeamSummarySchema),
});

export const TechnicianTeamAvailableListResponseSchema = z.object({
  data: z.array(TechnicianTeamAvailableOptionSchema),
});

export const TechnicianTeamDetailResponseSchema = z.object({
  data: TechnicianTeamDetailSchema,
});

export type TechnicianTeamListResponse = {
  data: z.infer<typeof TechnicianTeamSummarySchema>[];
};

export type TechnicianTeamAvailableListResponse = {
  data: z.infer<typeof TechnicianTeamAvailableOptionSchema>[];
};

export type TechnicianTeamDetailResponse = {
  data: z.infer<typeof TechnicianTeamDetailSchema>;
};
