import { z } from "../../../zod";

export const ReservationStatusSchema = z
  .enum(["PENDING", "ACTIVE", "CANCELLED", "EXPIRED"])
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

export type ReservationDetail = z.infer<typeof ReservationDetailSchema>;
