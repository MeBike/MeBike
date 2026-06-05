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
});

export type StationForecast = z.infer<typeof StationForecastSchema>;

export const ReservationForecastHourSchema = z.object({
  label: z.string(),
  timestamp: z.string().datetime(),
  reservedCount: z.number().int().nonnegative(),
  demandLevel: z.enum(["high", "medium", "low"]),
});

export type ReservationForecastHour = z.infer<typeof ReservationForecastHourSchema>;

export const ReservationForecastSchema = z.object({
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  station: StationForecastSchema.nullable(),
  hours: z.array(ReservationForecastHourSchema),
});

export type ReservationForecast = z.infer<typeof ReservationForecastSchema>;
