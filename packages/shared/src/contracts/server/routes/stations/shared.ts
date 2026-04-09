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
  StationTypeSchema,
  StationAlertsResponseSchema,
  StationDateRangeQuerySchema,
  StationErrorCodeSchema,
  StationErrorDetailSchema,
  StationReadSummarySchema,
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

export const StationSortFieldSchema = z.enum(["name", "totalCapacity", "updatedAt"]);

const LatitudeSchema = z.number()
  .refine(Number.isFinite, { message: "latitude must be a number" })
  .min(-90, { message: "latitude must be greater than or equal to -90" })
  .max(90, { message: "latitude must be less than or equal to 90" });

const LongitudeSchema = z.number()
  .refine(Number.isFinite, { message: "longitude must be a number" })
  .min(-180, { message: "longitude must be greater than or equal to -180" })
  .max(180, { message: "longitude must be less than or equal to 180" });

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

function requiredLatitudeQuery(example?: number) {
  return z.preprocess(
    value => (typeof value === "string" ? Number(value) : value),
    LatitudeSchema,
  ).openapi({ example });
}

function requiredLongitudeQuery(example?: number) {
  return z.preprocess(
    value => (typeof value === "string" ? Number(value) : value),
    LongitudeSchema,
  ).openapi({ example });
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
      LatitudeSchema,
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
      LongitudeSchema,
    )
    .optional()
    .openapi({ example });
}

export const StationErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: StationErrorDetailSchema.optional(),
}).openapi("StationErrorResponse", {
  description: "Standard error payload for station endpoints",
});

export const CreateStationErrorCodeSchema = z.enum([
  "STATION_NAME_ALREADY_EXISTS",
  "CAPACITY_LIMIT_EXCEEDED",
  "CAPACITY_SPLIT_INVALID",
  "OUTSIDE_SUPPORTED_AREA",
  "STATION_AGENCY_REQUIRED",
  "STATION_AGENCY_FORBIDDEN",
  "STATION_AGENCY_NOT_FOUND",
  "STATION_AGENCY_ALREADY_ASSIGNED",
]);

export const CreateStationErrorDetailSchema = StationErrorDetailSchema.extend({
  code: CreateStationErrorCodeSchema,
});

export const CreateStationErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: CreateStationErrorDetailSchema.optional(),
}).openapi("CreateStationErrorResponse", {
  description: "Error payload for create station endpoint",
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
    stationType: StationTypeSchema.optional(),
    agencyId: z.uuidv7().optional(),
    latitude: optionalLatitudeQuery(),
    longitude: optionalLongitudeQuery(),
    totalCapacity: optionalNumberQuery("totalCapacity", 20),
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
  stationType: StationTypeSchema.default("INTERNAL"),
  agencyId: z.uuidv7().nullable().optional(),
  totalCapacity: z.number()
    .int({
      message: "totalCapacity must be an integer",
    })
    .min(1, {
      message: "totalCapacity must be greater than or equal to 1",
    }),
  pickupSlotLimit: z.number()
    .int({
      message: "pickupSlotLimit must be an integer",
    })
    .min(0, {
      message: "pickupSlotLimit must be greater than or equal to 0",
    })
    .optional(),
  returnSlotLimit: z.number()
    .int({
      message: "returnSlotLimit must be an integer",
    })
    .min(0, {
      message: "returnSlotLimit must be greater than or equal to 0",
    })
    .optional(),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
}).superRefine((value, ctx) => {
  if (value.stationType === "AGENCY" && !value.agencyId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["agencyId"],
      message: "agencyId is required when stationType is AGENCY",
    });
  }

  if (value.stationType === "INTERNAL" && value.agencyId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["agencyId"],
      message: "agencyId must be null when stationType is INTERNAL",
    });
  }
}).openapi("CreateStationBody");

export const UpdateStationBodySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  stationType: StationTypeSchema.optional(),
  agencyId: z.uuidv7().nullable().optional(),
  totalCapacity: z.number()
    .int({
      message: "totalCapacity must be an integer",
    })
    .min(1, {
      message: "totalCapacity must be greater than or equal to 1",
    })
    .optional(),
  pickupSlotLimit: z.number()
    .int({
      message: "pickupSlotLimit must be an integer",
    })
    .min(0, {
      message: "pickupSlotLimit must be greater than or equal to 0",
    })
    .optional(),
  returnSlotLimit: z.number()
    .int({
      message: "returnSlotLimit must be an integer",
    })
    .min(0, {
      message: "returnSlotLimit must be greater than or equal to 0",
    })
    .optional(),
  latitude: LatitudeSchema.optional(),
  longitude: LongitudeSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.stationType === "AGENCY" && value.agencyId === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["agencyId"],
      message: "agencyId cannot be null when stationType is AGENCY",
    });
  }

  if (value.stationType === "INTERNAL" && value.agencyId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["agencyId"],
      message: "agencyId must be null when stationType is INTERNAL",
    });
  }
}).openapi("UpdateStationBody");

export const NearbyStationsQuerySchema = z
  .object({
    latitude: requiredLatitudeQuery(10.762622),
    longitude: requiredLongitudeQuery(106.660172),
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

export const StationReadSummarySchemaOpenApi = StationReadSummarySchema.openapi(
  "StationReadSummary",
  {
    description: "Nested station info for read endpoints",
  },
);

export const StationListResponseSchema = z
  .object({
    data: StationReadSummarySchema.array(),
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
          stationType: "INTERNAL",
          agencyId: null,
          location: {
            latitude: 10.762622,
            longitude: 106.660172,
          },
          capacity: {
            total: 20,
            pickupSlotLimit: 10,
            returnSlotLimit: 10,
            emptyPhysicalSlots: 2,
          },
          bikes: {
            total: 18,
            available: 10,
            booked: 3,
            broken: 1,
            reserved: 2,
            maintained: 1,
            unavailable: 1,
          },
          returnSlots: {
            active: 0,
            available: 2,
          },
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
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
