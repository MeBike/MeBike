import { z } from "../../../zod";

export const StatsSummarySchema = z.object({
  totalStations: z.number().int().nonnegative(),
  totalBikes: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
});

export type StatsSummary = z.infer<typeof StatsSummarySchema>;

export const StationForecastSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  currentBikes: z.number().int().nonnegative(),
  reservedCount: z.number().int().nonnegative(),
  expectedBikes: z.number().int(),
});

export type StationForecast = z.infer<typeof StationForecastSchema>;

export const ReservationForecastSchema = z.object({
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  station: StationForecastSchema.nullable(),
});

export type ReservationForecast = z.infer<typeof ReservationForecastSchema>;
