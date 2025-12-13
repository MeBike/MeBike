import { z } from "../../../zod";
import { BikeStatusSchema } from "./schemas";

export const BikeSummarySchema = z.object({
  id: z.uuidv7(),
  chipId: z.string(),
  stationId: z.uuidv7().nullable(),
  supplierId: z.uuidv7().nullable(),
  status: BikeStatusSchema,
  // Ratings & station info omitted until implemented in backend
});

export const BikeRentalHistoryItemSchema = z.object({
  _id: z.uuidv7(),
  start_time: z.string(),
  end_time: z.string().optional(),
  duration: z.number().optional(),
  total_price: z.number().optional(),
  user: z.object({
    _id: z.uuidv7(),
    fullname: z.string(),
  }),
  start_station: z.object({
    _id: z.uuidv7(),
    name: z.string(),
  }),
  end_station: z
    .object({
      _id: z.uuidv7(),
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
  bike_id: z.uuidv7(),
  bike_chip_id: z.string(),
  total_revenue: z.number(),
  rental_count: z.number(),
  station: z.object({
    _id: z.uuidv7(),
    name: z.string(),
  }),
});

export type BikeSummary = z.infer<typeof BikeSummarySchema>;
export type BikeRentalHistoryItem = z.infer<typeof BikeRentalHistoryItemSchema>;
export type BikeActivityStats = z.infer<typeof BikeActivityStatsSchema>;
export type BikeRentalStats = z.infer<typeof BikeRentalStatsSchema>;
export type HighestRevenueBike = z.infer<typeof HighestRevenueBikeSchema>;
