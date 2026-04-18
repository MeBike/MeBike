import { z } from "../../../zod";
import { paginationQueryFields, SortDirectionSchema } from "../schemas";
import { StationTypeSchema } from "./models";

export const StationIsoDateTimeStringSchema = z.iso
  .datetime()
  .openapi({
    description: "ISO 8601 datetime string",
    example: "2025-12-09T00:00:00.000Z",
  });

export const StationDateRangeQuerySchema = z
  .object({
    from: StationIsoDateTimeStringSchema.optional(),
    to: StationIsoDateTimeStringSchema.optional(),
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

export type StationDateRangeQuery = z.infer<
  typeof StationDateRangeQuerySchema
>;

function optionalNumberQuery(field: string, example?: number) {
  return z
    .preprocess(
      value =>
        value === undefined || value === null
          ? undefined
          : typeof value === "string"
            ? Number(value)
            : value,
      z
        .number()
        .refine(Number.isFinite, { message: `${field} must be a number` }),
    )
    .optional()
    .openapi({ example });
}

function optionalLatitudeQuery(example?: number) {
  return z
    .preprocess(
      value =>
        value === undefined || value === null
          ? undefined
          : typeof value === "string"
            ? Number(value)
            : value,
      z
        .number()
        .refine(Number.isFinite, { message: "latitude must be a number" })
        .min(-90, { message: "latitude must be greater than or equal to -90" })
        .max(90, { message: "latitude must be less than or equal to 90" }),
    )
    .optional()
    .openapi({ example });
}

function optionalLongitudeQuery(example?: number) {
  return z
    .preprocess(
      value =>
        value === undefined || value === null
          ? undefined
          : typeof value === "string"
            ? Number(value)
            : value,
      z
        .number()
        .refine(Number.isFinite, { message: "longitude must be a number" })
        .min(-180, { message: "longitude must be greater than or equal to -180" })
        .max(180, { message: "longitude must be less than or equal to 180" }),
    )
    .optional()
    .openapi({ example });
}

export const StationListQuerySchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    stationType: StationTypeSchema.optional(),
    agencyId: z.uuidv7().optional(),
    latitude: optionalLatitudeQuery(),
    longitude: optionalLongitudeQuery(),
    totalCapacity: optionalNumberQuery("totalCapacity", 20),
    ...paginationQueryFields,
    sortBy: z.enum(["name", "totalCapacity", "updatedAt"]).optional().openapi({
      description: "Sort field",
      example: "name",
    }),
    sortDir: SortDirectionSchema.optional().openapi({
      description: "Sort direction",
      example: "asc",
    }),
  })
  .openapi("StationListQuery", {
    description: "Optional filters for listing stations",
  });

export type StationListQuery = z.infer<typeof StationListQuerySchema>;
