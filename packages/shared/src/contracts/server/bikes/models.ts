import { z } from "../../../zod";
import { BikeStatusSchema } from "./schemas";

export const BikeSupplierSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
});

export const BikeStationSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
});

export const BikeRatingSchema = z.object({
  averageRating: z.number(),
  totalRatings: z.number().int().nonnegative(),
});

export const BikeSummarySchema = z.object({
  id: z.uuidv7(),
  bikeNumber: z.string(),
  chipId: z.string(),
  stationId: z.uuidv7().nullable(),
  station: BikeStationSchema.nullable(),
  supplier: BikeSupplierSchema.nullable(),
  status: BikeStatusSchema,
  rating: BikeRatingSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
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
  bikeId: z.uuidv7(),
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

export const BikeStatisticsSchema = z.object({
  RESERVED: z.number(),
  AVAILABLE: z.number(),
  RENTED: z.number(),
  UNAVAILABLE: z.number(),
  BROKEN: z.number(),
});

export const BikeStatsSchema = z.object({
  id: z.uuidv7(),
  totalRentals: z.number(),
  totalRevenue: z.number(),
  totalDurationMinutes: z.number(),
  totalReports: z.number(),
});

export const HighestRevenueBikeSchema = z.object({
  bikeId: z.uuidv7(),
  bikeChipId: z.string(),
  totalRevenue: z.number(),
  rentalCount: z.number(),
  station: z.object({
    id: z.uuidv7(),
    name: z.string(),
  }).nullable(),
});

export type BikeSummary = z.infer<typeof BikeSummarySchema>;
export type BikeSupplier = z.infer<typeof BikeSupplierSchema>;
export type BikeStation = z.infer<typeof BikeStationSchema>;
export type BikeRating = z.infer<typeof BikeRatingSchema>;
export type BikeRentalHistoryItem = z.infer<typeof BikeRentalHistoryItemSchema>;
export type BikeActivityStats = z.infer<typeof BikeActivityStatsSchema>;
export type BikeRentalStats = z.infer<typeof BikeRentalStatsSchema>;
export type BikeStatistics = z.infer<typeof BikeStatisticsSchema>;
export type BikeStats = z.infer<typeof BikeStatsSchema>;
export type HighestRevenueBike = z.infer<typeof HighestRevenueBikeSchema>;
