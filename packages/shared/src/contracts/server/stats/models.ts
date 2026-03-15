import { z } from "../../../zod";

export const StatsSummarySchema = z.object({
  totalStations: z.number().int().nonnegative(),
  totalBikes: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
});

export type StatsSummary = z.infer<typeof StatsSummarySchema>;
