import { z } from "../../../zod";

export const RatingDetailSchema = z.object({
  id: z.uuidv7(),
  rentalId: z.uuidv7(),
  userId: z.uuidv7(),
  bikeId: z.uuidv7().nullable(),
  stationId: z.uuidv7().nullable(),
  bikeScore: z.number().int().min(1).max(5),
  stationScore: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable(),
  reasonIds: z.array(z.uuidv7()).min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  editedAt: z.iso.datetime().nullable(),
});

export const AdminRatingUserSchema = z.object({
  id: z.uuidv7(),
  fullName: z.string(),
  phoneNumber: z.string().nullable(),
});

export const AdminRatingBikeSchema = z.object({
  id: z.uuidv7(),
  bikeNumber: z.string(),
}).nullable();

export const AdminRatingStationSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
}).nullable();

export const AdminRatingRentalSchema = z.object({
  id: z.uuidv7(),
  status: z.enum(["RENTED", "COMPLETED", "OVERDUE_UNRETURNED"]),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().nullable(),
});

export const AdminRatingReasonSchema = z.object({
  id: z.uuidv7(),
  type: z.enum(["ISSUE", "COMPLIMENT"]),
  appliesTo: z.enum(["bike", "station"]),
  message: z.string(),
});

export const AdminRatingListItemSchema = z.object({
  id: z.uuidv7(),
  rentalId: z.uuidv7(),
  user: AdminRatingUserSchema,
  bike: AdminRatingBikeSchema,
  station: AdminRatingStationSchema,
  bikeScore: z.number().int().min(1).max(5),
  stationScore: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable(),
  reasons: z.array(AdminRatingReasonSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  editedAt: z.iso.datetime().nullable(),
});

export const AdminRatingDetailSchema = AdminRatingListItemSchema.extend({
  rental: AdminRatingRentalSchema,
});

export const RatingReasonSchema = z.object({
  id: z.uuidv7(),
  type: z.enum(["ISSUE", "COMPLIMENT"]),
  appliesTo: z.enum(["bike", "station"]),
  message: z.string(),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});

export const RatingSummaryBreakdownSchema = z.object({
  oneStar: z.number().int().nonnegative(),
  twoStar: z.number().int().nonnegative(),
  threeStar: z.number().int().nonnegative(),
  fourStar: z.number().int().nonnegative(),
  fiveStar: z.number().int().nonnegative(),
});

export const RatingSummarySchema = z.object({
  averageRating: z.number(),
  totalRatings: z.number().int().nonnegative(),
  breakdown: RatingSummaryBreakdownSchema,
});

export type RatingDetail = z.infer<typeof RatingDetailSchema>;
export type AdminRatingUser = z.infer<typeof AdminRatingUserSchema>;
export type AdminRatingBike = z.infer<typeof AdminRatingBikeSchema>;
export type AdminRatingStation = z.infer<typeof AdminRatingStationSchema>;
export type AdminRatingRental = z.infer<typeof AdminRatingRentalSchema>;
export type AdminRatingReason = z.infer<typeof AdminRatingReasonSchema>;
export type AdminRatingListItem = z.infer<typeof AdminRatingListItemSchema>;
export type AdminRatingDetail = z.infer<typeof AdminRatingDetailSchema>;
export type RatingReason = z.infer<typeof RatingReasonSchema>;
export type RatingSummary = z.infer<typeof RatingSummarySchema>;
