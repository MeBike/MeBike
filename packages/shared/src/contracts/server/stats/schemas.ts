import { z } from "../../../zod";
import { StatsSummarySchema } from "./models";

export const StatsSummaryResponseSchema = StatsSummarySchema.openapi("StatsSummaryResponse");

export const StatsErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: z.string(),
  }),
}).openapi("StatsErrorResponse");

export type StatsSummaryResponse = z.infer<typeof StatsSummaryResponseSchema>;
