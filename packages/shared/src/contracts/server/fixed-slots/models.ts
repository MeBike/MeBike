import { z } from "../../../zod";

export const FixedSlotTemplateStatusSchema = z
  .enum(["ACTIVE", "CANCELLED"])
  .openapi("FixedSlotTemplateStatus");

export const FixedSlotDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "slotDates must use YYYY-MM-DD format",
  })
  .openapi({
    description: "Slot date in YYYY-MM-DD format",
    example: "2026-04-20",
  });

export const FixedSlotTimeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: "slotStart must use HH:mm format",
  })
  .openapi({
    description: "Slot start time in HH:mm format",
    example: "09:30",
  });

export const FixedSlotTemplateStationSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
}).openapi("FixedSlotTemplateStation");

export const FixedSlotTemplateSchema = z.object({
  id: z.uuidv7(),
  userId: z.uuidv7(),
  station: FixedSlotTemplateStationSchema,
  slotStart: FixedSlotTimeStringSchema,
  slotDates: z.array(FixedSlotDateStringSchema),
  status: FixedSlotTemplateStatusSchema,
  updatedAt: z.string().datetime(),
}).openapi("FixedSlotTemplate");

export type FixedSlotTemplate = z.infer<typeof FixedSlotTemplateSchema>;
