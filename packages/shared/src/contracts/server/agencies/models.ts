import { z } from "../../../zod";

import { AccountStatusSchema } from "../users";
import { StationBikesSchema, StationReadSummarySchema, StationTypeSchema } from "../stations";

export const AgencyStationSummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  stationType: StationTypeSchema,
});

// Full station data for agency detail (excludes agencyId, workers, and fixed bikes)
export const AgencyDetailStationSchema = StationReadSummarySchema.omit({
  agencyId: true,
  workers: true,
}).extend({
  bikes: StationBikesSchema.omit({ fixed: true }),
});

export const AgencySummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  contactPhone: z.string().nullable(),
  status: AccountStatusSchema,
  station: AgencyStationSummarySchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).openapi("AgencySummary");

export const AgencyDetailSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  contactPhone: z.string().nullable(),
  status: AccountStatusSchema,
  station: AgencyDetailStationSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).openapi("AgencyDetail");

export const AgencyOperationalPeriodSchema = z.object({
  from: z.iso.datetime(),
  to: z.iso.datetime(),
}).openapi("AgencyOperationalPeriod");

export const AgencyOperatorStatsSchema = z.object({
  totalOperators: z.number(),
  activeOperators: z.number(),
}).openapi("AgencyOperatorStats");

export const AgencyCurrentStationStatsSchema = z.object({
  totalCapacity: z.number(),
  returnSlotLimit: z.number(),
  totalBikes: z.number(),
  availableBikes: z.number(),
  bookedBikes: z.number(),
  brokenBikes: z.number(),
  reservedBikes: z.number(),
  pendingDispatchBikes: z.number(),
  transportingBikes: z.number(),
  swappingBikes: z.number(),
  lostBikes: z.number(),
  disabledBikes: z.number(),
  emptySlots: z.number(),
  occupancyRate: z.number(),
}).openapi("AgencyCurrentStationStats");

export const AgencyPickupStatsSchema = z.object({
  totalRentals: z.number(),
  activeRentals: z.number(),
  completedRentals: z.number(),
  totalRevenue: z.number(),
  avgDurationMinutes: z.number(),
}).openapi("AgencyPickupStats");

export const AgencyReturnStatsSchema = z.object({
  totalReturns: z.number(),
  agencyConfirmedReturns: z.number(),
}).openapi("AgencyReturnStats");

export const AgencyIncidentStatsSchema = z.object({
  totalIncidentsInPeriod: z.number(),
  openIncidents: z.number(),
  resolvedIncidentsInPeriod: z.number(),
  criticalOpenIncidents: z.number(),
}).openapi("AgencyIncidentStats");

export const AgencyOperationalStatsSchema = z.object({
  agency: AgencySummarySchema,
  period: AgencyOperationalPeriodSchema,
  operators: AgencyOperatorStatsSchema,
  currentStation: AgencyCurrentStationStatsSchema,
  pickups: AgencyPickupStatsSchema,
  returns: AgencyReturnStatsSchema,
  incidents: AgencyIncidentStatsSchema,
}).openapi("AgencyOperationalStats");

export type AgencySummary = z.infer<typeof AgencySummarySchema>;
export type AgencyDetail = z.infer<typeof AgencyDetailSchema>;
export type AgencyDetailStation = z.infer<typeof AgencyDetailStationSchema>;
export type AgencyOperationalStats = z.infer<typeof AgencyOperationalStatsSchema>;
