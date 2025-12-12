import { z } from "../../../../zod";
import { ServerErrorResponseSchema } from "../../schemas";
import {
  BikeRevenueResponseSchema,
  HighestRevenueStationSchema,
  NearestAvailableBikeSchema,
  StationAlertsResponseSchema,
  StationDateRangeQuerySchema,
  StationErrorCodeSchema,
  StationErrorDetailSchema,
  StationRevenueResponseSchema,
  StationStatsResponseSchema,
  StationSummarySchema,
} from "../../stations";

export const StationSortFieldSchema = z.enum(["name", "capacity", "updatedAt"]);
export const SortDirectionSchema = z.enum(["asc", "desc"]);

export const StationErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: StationErrorDetailSchema.optional(),
}).openapi("StationErrorResponse", {
  description: "Standard error payload for station endpoints",
});

export const StationIdParamSchema = z
  .object({
    stationId: z.string().openapi({
      example: "665fd6e36b7e5d53f8f3d2c9",
      description: "Station identifier",
    }),
  })
  .openapi("StationIdParam", {
    description: "Path params for station id",
  });

export const StationListQuerySchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    capacity: z.coerce.number().optional(),
    page: z.coerce.number().int().positive().optional().openapi({
      description: "Page number (1-based)",
      example: 1,
    }),
    pageSize: z.coerce.number().int().positive().optional().openapi({
      description: "Page size",
      example: 50,
    }),
    sortBy: StationSortFieldSchema.optional().openapi({
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

export const NearbyStationsQuerySchema = z
  .object({
    latitude: z.coerce.number().openapi({ example: 10.762622 }),
    longitude: z.coerce.number().openapi({ example: 106.660172 }),
    maxDistance: z.coerce.number().optional().openapi({
      description: "Max distance in meters",
      example: 20000,
    }),
    page: z.coerce.number().int().positive().optional().openapi({
      description: "Page number (1-based)",
      example: 1,
    }),
    pageSize: z.coerce.number().int().positive().optional().openapi({
      description: "Page size",
      example: 50,
    }),
  })
  .openapi("NearbyStationsQuery", {
    description: "Coordinates for nearby/nearest station searches",
  });

export const StationRevenueQuerySchema = StationDateRangeQuerySchema.openapi(
  "StationRevenueQuery",
  {
    description: "Optional date range filters for revenue/statistics endpoints",
  },
);

export const StationSummarySchemaOpenApi = StationSummarySchema.openapi(
  "StationSummary",
  {
    description: "Basic station info",
  },
);

export const PaginationSchema = z
  .object({
    page: z.number().int().positive().openapi({
      description: "Current page number (1-based)",
      example: 1,
    }),
    pageSize: z.number().int().positive().openapi({
      description: "Number of items per page",
      example: 50,
    }),
    total: z.number().int().nonnegative().openapi({
      description: "Total number of items across all pages",
      example: 150,
    }),
    totalPages: z.number().int().nonnegative().openapi({
      description: "Total number of pages",
      example: 3,
    }),
  })
  .openapi("Pagination", {
    description: "Pagination metadata for paginated responses",
  });

export const StationListResponseSchema = z
  .object({
    pagination: PaginationSchema,
  })
  .openapi("StationListResponse", {
    description: "Paginated station listing",
    example: {
      data: [
        {
          id: "665fd6e36b7e5d53f8f3d2c9",
          name: "Central Station",
          address: "123 Main St",
          capacity: 20,
          latitude: 10.762622,
          longitude: 106.660172,
        },
      ],
      pagination: {
        page: 1,
        pageSize: 50,
        total: 150,
        totalPages: 3,
      },
    },
  });

export const StationStatsResponseSchemaOpenApi = StationStatsResponseSchema.openapi(
  "StationStatsResponse",
  {
    description: "Statistics for a single station in a period",
  },
);

export const StationRevenueResponseSchemaOpenApi
  = StationRevenueResponseSchema.openapi("StationRevenueResponse", {
    description: "Revenue metrics grouped by station (and bikes per station)",
  });

export const BikeRevenueResponseSchemaOpenApi = BikeRevenueResponseSchema.openapi(
  "BikeRevenueResponse",
  {
    description: "Revenue grouped by station and bikes",
  },
);

export const HighestRevenueStationSchemaOpenApi
  = HighestRevenueStationSchema.openapi("HighestRevenueStationResponse", {
    description: "Top station by revenue (may be null if no data)",
  });

export const NearestAvailableBikeSchemaOpenApi
  = NearestAvailableBikeSchema.openapi("NearestAvailableBikeResponse", {
    description: "Nearest available bike result",
  });

export const StationAlertsResponseSchemaOpenApi
  = StationAlertsResponseSchema.openapi("StationAlertsResponse", {
    description: "Alert summary for stations",
  });

export {
  StationDateRangeQuerySchema,
  StationErrorCodeSchema,
};
