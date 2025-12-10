import { z } from "../../../zod";

export const StationSummarySchema = z.object({
  _id: z.string(),
  name: z.string(),
  address: z.string(),
  capacity: z.number(),
});

export const StationStatsCurrentBikesSchema = z.object({
  totalBikes: z.number(),
  available: z.number(),
  booked: z.number(),
  broken: z.number(),
  reserved: z.number(),
  maintained: z.number(),
  unavailable: z.number(),
  emptySlots: z.number(),
});

export const StationStatsReportsSchema = z.object({
  totalReports: z.number(),
  byType: z.record(z.string(), z.number()),
});
  
export const StationStatsUtilizationSchema = z.object({
  rate: z.number(),
  availableMinutes: z.number(),
  usedMinutes: z.number(),
});

export const StationStatsResponseSchema = z.object({
  station: StationSummarySchema,
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  rentals: z.object({
    totalRentals: z.number(),
    totalRevenue: z.number(),
    totalDuration: z.number(),
    avgDuration: z.number(),
  }),
  returns: z.object({
    totalReturns: z.number(),
  }),
  currentBikes: StationStatsCurrentBikesSchema,
  reports: StationStatsReportsSchema,
  utilization: StationStatsUtilizationSchema,
});

export const StationRevenueItemSchema = z.object({
  _id: z.string(),
  name: z.string(),
  address: z.string(),
  totalRentals: z.number(),
  totalRevenue: z.number(),
  totalRevenueFormatted: z.string(),
  totalDuration: z.number(),
  totalDurationFormatted: z.string(),
  avgDuration: z.number(),
  avgDurationFormatted: z.string(),
});

export const StationRevenueSummarySchema = z.object({
  totalStations: z.number(),
  totalRevenue: z.number(),
  totalRevenueFormatted: z.string(),
  totalRentals: z.number(),
  avgRevenuePerStation: z.number(),
  avgRevenuePerStationFormatted: z.string(),
});

export const StationRevenueResponseSchema = z.object({
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  summary: StationRevenueSummarySchema,
  stations: z.array(StationRevenueItemSchema),
});

export const BikeRevenueItemSchema = z.object({
  _id: z.string(),
  chip_id: z.string(),
  totalRevenue: z.number(),
  totalRevenueFormatted: z.string(),
  totalRentals: z.number(),
  totalDuration: z.number(),
});

export const BikeRevenueStationSchema = z.object({
  _id: z.string(),
  name: z.string(),
  address: z.string(),
  stationTotalRevenue: z.number(),
  stationTotalRevenueFormatted: z.string(),
  stationTotalRentals: z.number(),
  bikes: z.array(BikeRevenueItemSchema),
});

export const BikeRevenueResponseSchema = z.object({
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  summary: z.object({
    totalStations: z.number(),
    totalRevenue: z.number(),
    totalRevenueFormatted: z.string(),
    totalRentals: z.number(),
  }),
  stations: z.array(BikeRevenueStationSchema),
});

export const HighestRevenueStationSchema = z.object({
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  station: z
    .object({
      _id: z.string(),
      name: z.string(),
      address: z.string(),
      totalRevenue: z.number(),
      totalRevenueFormatted: z.string(),
      totalRentals: z.number(),
      totalDuration: z.number(),
      totalDurationFormatted: z.string(),
      avgDuration: z.number(),
      avgDurationFormatted: z.string(),
    })
    .nullable(),
  message: z.string().optional(),
});

export const NearbyStationSchema = StationSummarySchema.extend({
  distance_meters: z.number().optional(),
  distance_km: z.number().optional(),
});

export const NearestAvailableBikeSchema = z.object({
  bike_id: z.string(),
  chip_id: z.string(),
  status: z.string(),
  station_id: z.string(),
  station_name: z.string(),
  station_address: z.string(),
  distance_meters: z.number(),
  distance_km: z.number(),
});

const AlertItemBaseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  address: z.string(),
  capacity: z.number(),
  totalBikes: z.number(),
});

export const StationAlertOverloadedSchema = AlertItemBaseSchema.extend({
  utilizationRate: z.number(),
  availableBikes: z.number(),
  emptySlots: z.number(),
  severity: z.string(),
});

export const StationAlertUnderloadedSchema = AlertItemBaseSchema.extend({
  availableBikes: z.number(),
  availableRate: z.number(),
  emptySlots: z.number(),
  severity: z.string(),
});

export const StationAlertBrokenSchema = AlertItemBaseSchema.extend({
  brokenBikes: z.number(),
  brokenRate: z.number(),
  severity: z.string(),
});

export const StationAlertEmptySchema = AlertItemBaseSchema.extend({
  emptySlots: z.number(),
  emptyRate: z.number(),
  severity: z.string(),
});

export const StationAlertsResponseSchema = z.object({
  threshold: z.number(),
  totalStations: z.number(),
  alertsCount: z.object({
    overloaded: z.number(),
    underloaded: z.number(),
    broken: z.number(),
    empty: z.number(),
    total: z.number(),
  }),
  alerts: z.object({
    overloaded: z.array(StationAlertOverloadedSchema),
    underloaded: z.array(StationAlertUnderloadedSchema),
    broken: z.array(StationAlertBrokenSchema),
    empty: z.array(StationAlertEmptySchema),
  }),
});

export type StationSummary = z.infer<typeof StationSummarySchema>;
export type StationStatsResponse = z.infer<typeof StationStatsResponseSchema>;
export type StationRevenueResponse = z.infer<typeof StationRevenueResponseSchema>;
export type BikeRevenueResponse = z.infer<typeof BikeRevenueResponseSchema>;
export type HighestRevenueStation = z.infer<typeof HighestRevenueStationSchema>;
export type NearestAvailableBike = z.infer<typeof NearestAvailableBikeSchema>;
export type StationAlertsResponse = z.infer<typeof StationAlertsResponseSchema>;
