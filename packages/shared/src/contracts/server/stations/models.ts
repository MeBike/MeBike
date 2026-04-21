import { z } from "../../../zod";
import { UserRoleSchema } from "../users";

export const StationTypeSchema = z.enum(["INTERNAL", "AGENCY"]);

export const StationSummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
  stationType: StationTypeSchema,
  agencyId: z.uuidv7().nullable(),
  totalCapacity: z.number(),
  returnSlotLimit: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  totalBikes: z.number(),
  availableBikes: z.number(),
  bookedBikes: z.number(),
  brokenBikes: z.number(),
  reservedBikes: z.number(),
  maintainedBikes: z.number(),
  unavailableBikes: z.number(),
  emptySlots: z.number(),
});

export const StationLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const StationCapacitySchema = z.object({
  total: z.number(),
  returnSlotLimit: z.number(),
  emptyPhysicalSlots: z.number(),
});

export const StationBikesSchema = z.object({
  total: z.number(),
  available: z.number(),
  booked: z.number(),
  broken: z.number(),
  reserved: z.number(),
  maintained: z.number(),
  unavailable: z.number(),
});

export const StationReturnSlotsSchema = z.object({
  active: z.number(),
  available: z.number(),
});

export const StationReadSummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
  stationType: StationTypeSchema,
  agencyId: z.uuidv7().nullable(),
  location: StationLocationSchema,
  capacity: StationCapacitySchema,
  bikes: StationBikesSchema,
  returnSlots: StationReturnSlotsSchema,
  workers: z.array(z.object({
    userId: z.uuidv7(),
    fullName: z.string(),
    role: UserRoleSchema,
    technicianTeamId: z.uuidv7().nullable(),
    technicianTeamName: z.string().nullable(),
  })).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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
  station: StationReadSummarySchema,
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
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
  totalRentals: z.number(),
  totalRevenue: z.number(),
  totalDuration: z.number(),
  avgDuration: z.number(),
});

export const StationRevenueSummarySchema = z.object({
  totalStations: z.number(),
  totalRevenue: z.number(),
  totalRentals: z.number(),
  avgRevenuePerStation: z.number(),
});

export const StationRevenueGroupBySchema = z.enum(["DAY", "MONTH", "YEAR"]);

export const StationRevenueSeriesItemSchema = z.object({
  date: z.iso.datetime(),
  totalRevenue: z.number(),
  totalRentals: z.number(),
});

export const StationRevenueResponseSchema = z.object({
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  summary: StationRevenueSummarySchema,
  stations: z.array(StationRevenueItemSchema),
  groupBy: StationRevenueGroupBySchema.optional(),
  series: z.array(StationRevenueSeriesItemSchema).optional(),
});

export const BikeRevenueItemSchema = z.object({
  _id: z.uuidv7(),
  bikeNumber: z.string(),
  totalRevenue: z.number(),
  totalRevenueFormatted: z.string(),
  totalRentals: z.number(),
  totalDuration: z.number(),
});

export const BikeRevenueStationSchema = z.object({
  _id: z.uuidv7(),
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
      _id: z.uuidv7(),
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

export const NearbyStationSchema = StationReadSummarySchema.extend({
  distanceMeters: z.number().optional(),
  distanceKm: z.number().optional(),
});

export const NearestAvailableBikeSchema = z.object({
  bikeId: z.uuidv7(),
  bikeNumber: z.string(),
  status: z.string(),
  stationId: z.uuidv7(),
  stationName: z.string(),
  stationAddress: z.string(),
  distanceMeters: z.number(),
  distanceKm: z.number(),
});

const AlertItemBaseSchema = z.object({
  _id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
  totalCapacity: z.number(),
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
export type StationReadSummary = z.infer<typeof StationReadSummarySchema>;
export type StationType = z.infer<typeof StationTypeSchema>;
export type NearbyStation = z.infer<typeof NearbyStationSchema>;
export type StationStatsResponse = z.infer<typeof StationStatsResponseSchema>;
export type StationRevenueResponse = z.infer<typeof StationRevenueResponseSchema>;
export type BikeRevenueResponse = z.infer<typeof BikeRevenueResponseSchema>;
export type HighestRevenueStation = z.infer<typeof HighestRevenueStationSchema>;
export type NearestAvailableBike = z.infer<typeof NearestAvailableBikeSchema>;
export type StationAlertsResponse = z.infer<typeof StationAlertsResponseSchema>;
