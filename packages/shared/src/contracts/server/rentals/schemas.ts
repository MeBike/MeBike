import { z } from "../../../zod";

export const RentalIsoDateTimeStringSchema = z.iso
  .datetime()
  .openapi({
    description: "ISO 8601 datetime string",
    example: "2025-12-09T00:00:00.000Z",
  });

export const RentalDateRangeQuerySchema = z
  .object({
    from: RentalIsoDateTimeStringSchema.optional(),
    to: RentalIsoDateTimeStringSchema.optional(),
  })
  .refine(
    value =>
      !(value.from && value.to && new Date(value.from) > new Date(value.to)),
    {
      message: "from must not be after to",
      path: ["from"],
    },
  )
  .openapi({
    description:
      "Date range filters (optional). If both provided, from must be before or equal to to.",
  });

export type RentalDateRangeQuery = z.infer<
  typeof RentalDateRangeQuerySchema
>;
