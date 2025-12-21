import { z } from "../../../zod";
import { BikeStatusSchema } from "../bikes";
import { UserRoleSchema, VerifyStatusSchema } from "../users";

export const RentalStatusSchema = z.enum([
  "RENTED",
  "COMPLETED",
  "CANCELLED",
  "RESERVED",
]);

export const RentalIsoDateTimeSchema = z.iso.datetime();

// Core rental base schema
export const RentalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bikeId: z.string().optional(),
  startStation: z.string(),
  endStation: z.string().optional(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().optional(),
  duration: z.number(),
  totalPrice: z.number().optional(),
  subscriptionId: z.string().optional(),
  status: RentalStatusSchema,
  updatedAt: z.iso.datetime(),
});

// User info subset for rental lists
export const RentalUserSummarySchema = z.object({
  id: z.string(),
  fullname: z.string(),
});

// Full user info for detailed rentals
export const RentalUserDetailSchema = z.object({
  id: z.string(),
  fullname: z.string(),
  email: z.string(),
  verify: VerifyStatusSchema,
  location: z.string(),
  username: z.string(),
  phoneNumber: z.string(),
  avatar: z.string(),
  role: UserRoleSchema,
  nfcCardUid: z.string().optional(),
  updatedAt: z.iso.datetime(),
});

// Bike info for rentals
export const RentalBikeSchema = z.object({
  id: z.string(),
  chipId: z.string(),
  status: BikeStatusSchema,
  supplierId: z.string().optional(),
  updatedAt: z.iso.datetime(),
});

// Station info for rentals
export const RentalStationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  capacity: z.string(),
  updatedAt: z.iso.datetime(),
  locationGeo: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
});

// Rental with price (for creation/response)
export const RentalWithPriceSchema = RentalSchema.extend({
  totalPrice: z.number(),
});

// Rental list item (for paginated lists)
export const RentalListItemSchema = z.object({
  id: z.string(),
  user: RentalUserSummarySchema,
  bikeId: z.string(),
  status: RentalStatusSchema,
  startStation: z.string(),
  endStation: z.string().optional(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().optional(),
  duration: z.number(),
  totalPrice: z.number(),
  updatedAt: z.iso.datetime(),
});

// Detailed rental with populated data
export const RentalDetailSchema = z.object({
  id: z.string(),
  user: RentalUserDetailSchema,
  bike: RentalBikeSchema.nullable(),
  startStation: RentalStationSchema,
  endStation: RentalStationSchema.nullable(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().optional(),
  duration: z.number(),
  totalPrice: z.number(),
  subscriptionId: z.string().optional(),
  status: RentalStatusSchema,
  updatedAt: z.iso.datetime(),
});

// Enhanced rental with pricing details (for end rental responses)
export const RentalWithPricingSchema = RentalDetailSchema.extend({
  totalPrice: z.number(),
  extraHours: z.number().optional(),
  durationHours: z.number().optional(),
  totalSubUsages: z.number().optional(),
  originPrice: z.number().optional(),
  isReservation: z.boolean().optional(),
  prepaid: z.number().optional(),
  penaltyAmount: z.number().optional(),
  refundUsage: z.number().optional(),
});

// Revenue analytics models
export const RentalRevenueItemSchema = z.object({
  date: z.iso.datetime(),
  totalRevenue: z.number(),
  totalRentals: z.number(),
});

export const RentalRevenueResponseSchema = z.object({
  period: z.object({
    from: z.iso.datetime(),
    to: z.iso.datetime(),
  }),
  groupBy: z.enum(["DAY", "MONTH", "YEAR"]),
  data: z.array(RentalRevenueItemSchema),
});

// Station activity analytics
export const StationActivityItemSchema = z.object({
  station: z.string(),
  totalBikes: z.number(),
  totalRentals: z.number(),
  totalReturns: z.number(),
  totalUsageHours: z.number(),
  totalAvailableHours: z.number(),
  usageRate: z.number(),
});

export const StationActivityResponseSchema = z.object({
  period: z.object({
    from: z.iso.datetime(),
    to: z.iso.datetime(),
  }),
  data: z.array(StationActivityItemSchema),
});

// Dashboard summary models
export const HourlyRentalStatsSchema = z.object({
  hour: z.number().min(0).max(23),
  totalRentals: z.number(),
});

export const DashboardRevenueSummarySchema = z.object({
  totalRevenue: z.number(),
  totalRentals: z.number(),
});

export const DashboardSummarySchema = z.object({
  today: DashboardRevenueSummarySchema,
  yesterday: DashboardRevenueSummarySchema,
  revenueChange: z.number(),
  revenueTrend: z.enum(["UP", "DOWN", "STABLE"]),
  rentalChange: z.number(),
  rentalTrend: z.enum(["UP", "DOWN", "STABLE"]),
});

export const DashboardResponseSchema = z.object({
  revenueSummary: DashboardSummarySchema,
  hourlyRentalStats: z.array(HourlyRentalStatsSchema),
});

// Rental status counts
export const RentalStatusCountsSchema = z.object({
  RENTED: z.number(),
  COMPLETED: z.number(),
  CANCELLED: z.number(),
  RESERVED: z.number(),
});

export const RentalCountsResponseSchema = z.object({
  message: z.string(),
  result: RentalStatusCountsSchema,
});

export const CreateRentalRequestSchema = z.object({
  bikeId: z.string(),
  startStationId: z.string(),
  subscriptionId: z.string().optional(),
});

export const StaffCreateRentalRequestSchema = CreateRentalRequestSchema.extend({
  userId: z.string(),
});

export const CardTapRentalRequestSchema = z.object({
  chipId: z.string(),
  cardUid: z.string(),
});

export const EndRentalRequestSchema = z.object({
  endStation: z.string(),
  endTime: z.iso.datetime().optional(),
  reason: z.string(),
});

export const UpdateRentalRequestSchema = z.object({
  endStation: z.string().optional(),
  endTime: z.iso.datetime().optional(),
  status: RentalStatusSchema.optional(),
  totalPrice: z.number().optional(),
  reason: z.string(),
});

export const CancelRentalRequestSchema = z.object({
  bikeStatus: BikeStatusSchema.optional(),
  reason: z.string(),
});

export const RentalListResponseSchema = z.object({
  data: z.array(RentalListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const MyRentalListResponseSchema = z.object({
  data: z.array(RentalSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// TypeScript types
export type RentalStatus = z.infer<typeof RentalStatusSchema>;
export type Rental = z.infer<typeof RentalSchema>;
export type RentalWithPrice = z.infer<typeof RentalWithPriceSchema>;
export type CreateRentalResponse = {
  message: string;
  result: RentalWithPrice;
};
export type RentalListItem = z.infer<typeof RentalListItemSchema>;
export type RentalDetail = z.infer<typeof RentalDetailSchema>;
export type RentalWithPricing = z.infer<typeof RentalWithPricingSchema>;
export type RentalRevenueResponse = z.infer<typeof RentalRevenueResponseSchema>;
export type StationActivityResponse = z.infer<typeof StationActivityResponseSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
export type RentalStatusCounts = z.infer<typeof RentalStatusCountsSchema>;
export type RentalCountsResponse = z.infer<typeof RentalCountsResponseSchema>;
export type CreateRentalRequest = z.infer<typeof CreateRentalRequestSchema>;
export type StaffCreateRentalRequest = z.infer<typeof StaffCreateRentalRequestSchema>;
export type CardTapRentalRequest = z.infer<typeof CardTapRentalRequestSchema>;
export type EndRentalRequest = z.infer<typeof EndRentalRequestSchema>;
export type UpdateRentalRequest = z.infer<typeof UpdateRentalRequestSchema>;
export type CancelRentalRequest = z.infer<typeof CancelRentalRequestSchema>;
export type RentalListResponse = z.infer<typeof RentalListResponseSchema>;
export type MyRentalListResponse = z.infer<typeof MyRentalListResponseSchema>;
