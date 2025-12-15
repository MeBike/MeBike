import { z } from "../../../zod";
import { BikeStatusSchema } from "./schemas";

export const BikeSummarySchema = z.object({
  id: z.uuidv7(),
  chipId: z.string(),
  stationId: z.uuidv7().nullable(),
  supplierId: z.uuidv7().nullable(),
  status: BikeStatusSchema,
});

export const BikeRentalHistoryItemSchema = z.object({
  id: z.uuidv7(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  totalPrice: z.number().optional(),
  user: z.object({
    id: z.uuidv7(),
    fullname: z.string(),
  }),
  startStation: z.object({
    id: z.uuidv7(),
    name: z.string(),
  }),
  endStation: z
    .object({
      id: z.uuidv7(),
      name: z.string(),
    })
    .optional(),
});

export const BikeActivityStatsSchema = z.object({
  bikeId: z.string(),
  totalMinutesActive: z.number(),
  totalReports: z.number(),
  uptimePercentage: z.number(),
  monthlyStats: z.array(
    z.object({
      year: z.number(),
      month: z.number(),
      rentalsCount: z.number(),
      minutesActive: z.number(),
      revenue: z.number(),
    }),
  ),
});

export const BikeRentalStatsSchema = z.object({
  totalActiveBikes: z.number(),
  rentedBikes: z.number(),
  percentage: z.number(),
});

export const HighestRevenueBikeSchema = z.object({
  bikeId: z.uuidv7(),
  bikeChipId: z.string(),
  totalRevenue: z.number(),
  rentalCount: z.number(),
  station: z.object({
    id: z.uuidv7(),
    name: z.string(),
  }),
});

export type BikeSummary = z.infer<typeof BikeSummarySchema>;
export type BikeRentalHistoryItem = z.infer<typeof BikeRentalHistoryItemSchema>;
export type BikeActivityStats = z.infer<typeof BikeActivityStatsSchema>;
export type BikeRentalStats = z.infer<typeof BikeRentalStatsSchema>;
export type HighestRevenueBike = z.infer<typeof HighestRevenueBikeSchema>;
