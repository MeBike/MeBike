import { z } from "../../../../zod";
import {
  DashboardResponseSchema,
  RentalCountsResponseSchema,
  RentalDetailSchema,
  RentalErrorCodeSchema,
  RentalErrorResponseSchema,
  RentalIsoDateTimeStringSchema,
  RentalListItemSchema,
  RentalRevenueResponseSchema,
  RentalSchema,
  RentalStatusSchema,
  RentalWithPriceSchema,
  RentalWithPricingSchema,
  StationActivityResponseSchema,
} from "../../rentals";

export { RentalErrorResponseSchema };

export function rentalDateRangeWith<T extends z.ZodRawShape>(extra: T) {
  const base = z.object({
    from: RentalIsoDateTimeStringSchema.optional(),
    to: RentalIsoDateTimeStringSchema.optional(),
    ...extra,
  });

  return base.refine(
    (value: any) =>
      !(value.from && value.to && new Date(value.from) > new Date(value.to)),
    {
      message: "from must not be after to",
      path: ["from"],
    },
  );
}

export const RentalIdParamSchema = z
  .object({
    rentalId: z.string().openapi({
      example: "665fd6e36b7e5d53f8f3d2c9",
      description: "Rental identifier",
    }),
  })
  .openapi("RentalIdParam", {
    description: "Path params for rental id",
  });

export const UserIdParamSchema = z
  .object({
    userId: z.string().openapi({
      example: "665fd6e36b7e5d53f8f3d2c9",
      description: "User identifier",
    }),
  })
  .openapi("UserIdParam", {
    description: "Path params for user id",
  });

export const PhoneNumberParamSchema = z
  .object({
    number: z.string().openapi({
      example: "0901234567",
      description: "Phone number",
    }),
  })
  .openapi("PhoneNumberParam", {
    description: "Path params for phone number",
  });

export const SOSIdParamSchema = z
  .object({
    sosId: z.string().openapi({
      example: "665fd6e36b7e5d53f8f3d2c9",
      description: "SOS alert identifier",
    }),
  })
  .openapi("SOSIdParam", {
    description: "Path params for SOS alert id",
  });

export const RentalListQuerySchema = z
  .object({
    startStation: z.string().optional(),
    endStation: z.string().optional(),
    status: RentalStatusSchema.optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  })
  .openapi("RentalListQuery", {
    description: "Query parameters for rental listing",
  });

export const RentalStatsQuerySchema = rentalDateRangeWith({
  groupBy: z.enum(["DAY", "MONTH", "YEAR"]).optional(),
}).openapi("RentalStatsQuery", {
  description: "Query parameters for rental statistics",
});

export const RentalSchemaOpenApi = RentalSchema.openapi("Rental", {
  description: "Basic rental information",
});

export const RentalWithPriceSchemaOpenApi = RentalWithPriceSchema.openapi(
  "RentalWithPrice",
  {
    description: "Rental with calculated pricing",
  },
);

export const RentalDetailSchemaOpenApi = RentalDetailSchema.openapi("RentalDetail", {
  description: "Detailed rental with populated user, bike, and station data",
});

export const RentalWithPricingSchemaOpenApi = RentalWithPricingSchema.openapi(
  "RentalWithPricing",
  {
    description: "Detailed rental with enhanced pricing information",
  },
);

export const RentalListItemSchemaOpenApi = RentalListItemSchema.openapi(
  "RentalListItem",
  {
    description: "Rental item for paginated lists",
  },
);

export const RentalListResponseSchema = z
  .object({
    data: z.array(RentalListItemSchemaOpenApi),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("RentalListResponse", {
    description: "Paginated rental list",
  });

export const MyRentalListResponseSchema = z
  .object({
    data: z.array(RentalSchemaOpenApi),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("MyRentalListResponse", {
    description: "Paginated user rental list",
  });

export function createSuccessResponse<T extends z.ZodType>(dataSchema: T, description: string) {
  return z
    .object({
      message: z.string(),
      result: dataSchema,
    })
    .openapi("SuccessResponse", { description });
}

export {
  DashboardResponseSchema,
  RentalCountsResponseSchema,
  RentalErrorCodeSchema,
  RentalRevenueResponseSchema,
  RentalStatusSchema,
  StationActivityResponseSchema,
};
