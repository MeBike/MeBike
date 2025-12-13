import { z } from "../../../zod";
import { BikeStatusSchema } from "./schemas";

export const BikeSummarySchema = z.object({
  id: z.string(),
  chipId: z.string(),
  stationId: z.string().nullable(),
  supplierId: z.string().nullable(),
  status: BikeStatusSchema,
  // Ratings & station info omitted until implemented in backend
});

export const BikeRentalHistoryItemSchema = z.object({
  _id: z.string(),
  start_time: z.string(),
  end_time: z.string().optional(),
  duration: z.number().optional(),
  total_price: z.number().optional(),
  user: z.object({
    _id: z.string(),
    fullname: z.string(),
  }),
  start_station: z.object({
    _id: z.string(),
    name: z.string(),
  }),
  end_station: z
    .object({
      _id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export const BikeActivityStatsSchema = z.object({
  bike_id: z.string(),
  total_minutes_active: z.number(),
  total_reports: z.number(),
  uptime_percentage: z.number(),
  monthly_stats: z.array(
    z.object({
      year: z.number(),
      month: z.number(),
      rentals_count: z.number(),
      minutes_active: z.number(),
      revenue: z.number(),
    }),
  ),
});

export const BikeRentalStatsSchema = z.object({
  total_active_bikes: z.number(),
  rented_bikes: z.number(),
  percentage: z.number(),
});

export const HighestRevenueBikeSchema = z.object({
  bike_id: z.string(),
  bike_chip_id: z.string(),
  total_revenue: z.number(),
  rental_count: z.number(),
  station: z.object({
    _id: z.string(),
    name: z.string(),
  }),
});

export type BikeSummary = z.infer<typeof BikeSummarySchema>;
export type BikeRentalHistoryItem = z.infer<typeof BikeRentalHistoryItemSchema>;
export type BikeActivityStats = z.infer<typeof BikeActivityStatsSchema>;
export type BikeRentalStats = z.infer<typeof BikeRentalStatsSchema>;
export type HighestRevenueBike = z.infer<typeof HighestRevenueBikeSchema>;
