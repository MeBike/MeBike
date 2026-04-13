import { z } from "../../../zod";

export const RedistributionIsoDateTimeStringSchema = z.iso
  .datetime()
  .openapi({
    description: "ISO 8601 datetime string",
    example: "2025-12-09T00:00:00.000Z",
  });

export const RedistributionDateRangeQuerySchema = z
  .object({
    from: RedistributionIsoDateTimeStringSchema.optional(),
    to: RedistributionIsoDateTimeStringSchema.optional(),
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

export type RedistributionDateRangeQuery = z.infer<
  typeof RedistributionDateRangeQuerySchema
>;
