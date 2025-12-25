import { z } from "../../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
} from "../../schemas";
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

export {
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
  StationDateRangeQuerySchema,
  StationErrorCodeSchema,
};

export const StationSortFieldSchema = z.enum(["name", "capacity", "updatedAt"]);

function requiredNumberQuery(field: string, example?: number) {
  return z.preprocess(
    value => (typeof value === "string" ? Number(value) : value),
    z
      .number()
      .refine(Number.isFinite, { message: `${field} must be a number` }),
  ).openapi({ example });
}

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

export const StationErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: StationErrorDetailSchema.optional(),
}).openapi("StationErrorResponse", {
  description: "Standard error payload for station endpoints",
});

export const StationIdParamSchema = z
  .object({
    stationId: z.union([z.uuidv4().openapi({
      example: "665fd6e3-6b7e-5d53-f8f3-d2c900000000",
      description: "Station identifier (UUID v4)",
    }), z.uuidv7().openapi({
      example: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
      description: "Station identifier (UUID v7)",
    })]),
  })
  .openapi("StationIdParam", {
    description: "Path params for station id",
  });

export const StationListQuerySchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    latitude: optionalNumberQuery("latitude"),
    longitude: optionalNumberQuery("longitude"),
    capacity: optionalNumberQuery("capacity", 20),
    ...paginationQueryFields,
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

export const CreateStationBodySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  capacity: z.number().refine(Number.isFinite, {
    message: "capacity must be a number",
  }),
  latitude: z.number().refine(Number.isFinite, {
    message: "latitude must be a number",
  }),
  longitude: z.number().refine(Number.isFinite, {
    message: "longitude must be a number",
  }),
}).openapi("CreateStationBody");

export const UpdateStationBodySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  capacity: z.number().refine(Number.isFinite, {
    message: "capacity must be a number",
  }).optional(),
  latitude: z.number().refine(Number.isFinite, {
    message: "latitude must be a number",
  }).optional(),
  longitude: z.number().refine(Number.isFinite, {
    message: "longitude must be a number",
  }).optional(),
}).openapi("UpdateStationBody");

export const NearbyStationsQuerySchema = z
  .object({
    latitude: requiredNumberQuery("latitude", 10.762622),
    longitude: requiredNumberQuery("longitude", 106.660172),
    maxDistance: optionalNumberQuery("maxDistance", 20000).openapi({
      description: "Max distance in meters",
      example: 20000,
    }),
    ...paginationQueryFields,
  })
  .openapi("NearbyStationsQuery", {
    description: "Coordinates for nearby/nearest station searches (optional; empty result if missing)",
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

export const StationListResponseSchema = z
  .object({
    data: StationSummarySchema.array(),
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
