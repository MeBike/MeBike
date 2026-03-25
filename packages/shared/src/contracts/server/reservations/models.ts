import { z } from "../../../zod";
import { BikeStatusSchema } from "../bikes";
import { UserRoleSchema } from "../users";

export const ReservationStatusSchema = z
  .enum(["PENDING", "ACTIVE", "FULFILLED", "CANCELLED", "EXPIRED"])
  .openapi("ReservationStatus");

export const ReservationOptionSchema = z
  .enum(["ONE_TIME", "FIXED_SLOT", "SUBSCRIPTION"])
  .openapi("ReservationOption");

export const ReservationDetailSchema = z.object({
  id: z.uuidv7(),
  userId: z.uuidv7(),
  bikeId: z.uuidv7().optional(),
  stationId: z.uuidv7(),
  reservationOption: ReservationOptionSchema,
  fixedSlotTemplateId: z.uuidv7().optional(),
  subscriptionId: z.uuidv7().optional(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().optional(),
  prepaid: z.string().openapi({ example: "5000.00" }),
  status: ReservationStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).openapi("ReservationDetail");

export const ReservationDetailUserSchema = z.object({
  id: z.uuidv7(),
  fullName: z.string(),
  username: z.string().nullable(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  avatar: z.string().nullable(),
  role: UserRoleSchema,
}).openapi("ReservationDetailUser");

export const ReservationDetailBikeSchema = z.object({
  id: z.uuidv7(),
  chipId: z.string(),
  status: BikeStatusSchema,
}).openapi("ReservationDetailBike");

export const ReservationDetailStationSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
}).openapi("ReservationDetailStation");

export const ReservationExpandedDetailSchema = ReservationDetailSchema.extend({
  user: ReservationDetailUserSchema,
  bike: ReservationDetailBikeSchema.nullable(),
  station: ReservationDetailStationSchema,
}).openapi("ReservationExpandedDetail");

export type ReservationDetail = z.infer<typeof ReservationDetailSchema>;
export type ReservationExpandedDetail = z.infer<typeof ReservationExpandedDetailSchema>;
