import { z } from "../../../zod";
import { BikeStatusSchema } from "../bikes";

export const RentalStatusSchema = z.enum([
  "RENTED",
  "COMPLETED",
  "CANCELLED",
  "RESERVED",
]);

export const UserRoleSchema = z.enum([
  "USER",
  "STAFF",
  "ADMIN",
  "SOS",
]);

export const VerifyStatusSchema = z.enum([
  "UNVERIFIED",
  "VERIFIED",
  "BANNED",
]);

// export const BikeStatusSchema = z.enum([
//   "CÓ SẴN",
//   "ĐANG ĐƯỢC THUÊ",
//   "BỊ HỎNG",
//   "ĐÃ ĐẶT TRƯỚC",
//   "ĐANG BẢO TRÌ",
//   "KHÔNG CÓ SẮN",
// ]);

// Core rental base schema
export const RentalSchema = z.object({
  _id: z.string(),
  user_id: z.string(),
  bike_id: z.string().optional(),
  start_station: z.string(),
  end_station: z.string().optional(),
  start_time: z.string(), // ISO date string
  end_time: z.string().optional(), // ISO date string
  duration: z.number(),
  total_price: z.number().optional(),
  subscription_id: z.string().optional(),
  status: RentalStatusSchema,
  created_at: z.string(), // ISO date string
  updated_at: z.string(), // ISO date string
});

// User info subset for rental lists
export const RentalUserSummarySchema = z.object({
  _id: z.string(),
  fullname: z.string(),
});

// Full user info for detailed rentals
export const RentalUserDetailSchema = z.object({
  _id: z.string(),
  fullname: z.string(),
  email: z.string(),
  verify: VerifyStatusSchema,
  location: z.string(),
  username: z.string(),
  phone_number: z.string(),
  avatar: z.string(),
  role: UserRoleSchema,
  nfc_card_uid: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Bike info for rentals
export const RentalBikeSchema = z.object({
  _id: z.string(),
  chip_id: z.string(),
  status: BikeStatusSchema,
  supplier_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Station info for rentals
export const RentalStationSchema = z.object({
  _id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  capacity: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  location_geo: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
  }).optional(),
});

// Rental with price (for creation/response)
export const RentalWithPriceSchema = RentalSchema.extend({
  total_price: z.number(),
});

// Rental list item (for paginated lists)
export const RentalListItemSchema = z.object({
  _id: z.string(),
  user: RentalUserSummarySchema,
  bike_id: z.string(),
  status: RentalStatusSchema,
  start_station: z.string(),
  end_station: z.string().optional(),
  start_time: z.string(),
  end_time: z.string().optional(),
  duration: z.number(),
  total_price: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Detailed rental with populated data
export const RentalDetailSchema = z.object({
  _id: z.string(),
  user: RentalUserDetailSchema,
  bike: RentalBikeSchema.nullable(),
  start_station: RentalStationSchema,
  end_station: RentalStationSchema.nullable(),
  start_time: z.string(),
  end_time: z.string().optional(),
  duration: z.number(),
  total_price: z.number(),
  subscription_id: z.string().optional(),
  status: RentalStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

// Enhanced rental with pricing details (for end rental responses)
export const RentalWithPricingSchema = RentalDetailSchema.extend({
  total_price: z.number(),
  extra_hours: z.number().optional(),
  duration_hours: z.number().optional(),
  total_sub_usages: z.number().optional(),
  origin_price: z.number().optional(),
  is_reservation: z.boolean().optional(),
  prepaid: z.number().optional(),
  penalty_amount: z.number().optional(),
  refund_usage: z.number().optional(),
});

// Revenue analytics models
export const RentalRevenueItemSchema = z.object({
  date: z.string(),
  totalRevenue: z.number(),
  totalRentals: z.number(),
});

export const RentalRevenueResponseSchema = z.object({
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  groupBy: z.enum(["NGÀY", "THÁNG", "NĂM"]),
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
    from: z.string(),
    to: z.string(),
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
  revenueTrend: z.enum(["Tăng", "Giảm", "Không đổi"]),
  rentalChange: z.number(),
  rentalTrend: z.enum(["Tăng", "Giảm", "Không đổi"]),
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

// Create rental request schemas
export const CreateRentalRequestSchema = z.object({
  bike_id: z.string(),
  subscription_id: z.string().optional(),
});

export const StaffCreateRentalRequestSchema = CreateRentalRequestSchema.extend({
  user_id: z.string(),
});

export const CardTapRentalRequestSchema = z.object({
  chip_id: z.string(),
  card_uid: z.string(),
});

// End rental request schemas
export const EndRentalRequestSchema = z.object({
  end_station: z.string(),
  end_time: z.string().optional(),
  reason: z.string(),
});

export const UpdateRentalRequestSchema = z.object({
  end_station: z.string().optional(),
  end_time: z.string().optional(),
  status: RentalStatusSchema.optional(),
  total_price: z.number().optional(),
  reason: z.string(),
});

export const CancelRentalRequestSchema = z.object({
  bikeStatus: BikeStatusSchema.optional(),
  reason: z.string(),
});

// TypeScript types
export type RentalStatus = z.infer<typeof RentalStatusSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type VerifyStatus = z.infer<typeof VerifyStatusSchema>;
export type BikeStatus = z.infer<typeof BikeStatusSchema>;
export type Rental = z.infer<typeof RentalSchema>;
export type RentalWithPrice = z.infer<typeof RentalWithPriceSchema>;
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
