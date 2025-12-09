import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../zod";
import { ServerErrorResponseSchema } from "../schemas";
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
} from "../stations";

const StationErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: StationErrorDetailSchema.optional(),
}).openapi("StationErrorResponse", {
  description: "Standard error payload for station endpoints",
});

const StationIdParamSchema = z
  .object({
    stationId: z.string().openapi({
      example: "665fd6e36b7e5d53f8f3d2c9",
      description: "Station identifier",
    }),
  })
  .openapi("StationIdParam", {
    description: "Path params for station id",
  });

const StationListQuerySchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    capacity: z.number().optional(),
  })
  .openapi("StationListQuery", {
    description: "Optional filters for listing stations",
  });

const NearbyStationsQuerySchema = z
  .object({
    latitude: z.number().openapi({ example: 10.762622 }),
    longitude: z.number().openapi({ example: 106.660172 }),
    maxDistance: z.number().optional().openapi({
      description: "Max distance in meters",
      example: 20000,
    }),
  })
  .openapi("NearbyStationsQuery", {
    description: "Coordinates for nearby/nearest station searches",
  });

const StationRevenueQuerySchema = StationDateRangeQuerySchema.openapi(
  "StationRevenueQuery",
  {
    description: "Optional date range filters for revenue/statistics endpoints",
  },
);

const StationSummarySchemaOpenApi = StationSummarySchema.openapi(
  "StationSummary",
  {
    description: "Basic station info",
  },
);

const StationListResponseSchema = z
  .object({
    data: z.array(StationSummarySchemaOpenApi),
  })
  .openapi("StationListResponse", {
    description: "Simplified station listing",
  });

const StationStatsResponseSchemaOpenApi = StationStatsResponseSchema.openapi(
  "StationStatsResponse",
  {
    description: "Statistics for a single station in a period",
  },
);

const StationRevenueResponseSchemaOpenApi
  = StationRevenueResponseSchema.openapi("StationRevenueResponse", {
    description: "Revenue metrics grouped by station (and bikes per station)",
  });

const BikeRevenueResponseSchemaOpenApi = BikeRevenueResponseSchema.openapi(
  "BikeRevenueResponse",
  {
    description: "Revenue grouped by station and bikes",
  },
);

const HighestRevenueStationSchemaOpenApi
  = HighestRevenueStationSchema.openapi("HighestRevenueStationResponse", {
    description: "Top station by revenue (may be null if no data)",
  });

const NearestAvailableBikeSchemaOpenApi
  = NearestAvailableBikeSchema.openapi("NearestAvailableBikeResponse", {
    description: "Nearest available bike result",
  });

const StationAlertsResponseSchemaOpenApi
  = StationAlertsResponseSchema.openapi("StationAlertsResponse", {
    description: "Alert summary for stations",
  });

export const stationsRoutes = {
  listStations: createRoute({
    method: "get",
    path: "/v1/stations",
    request: {
      query: StationListQuerySchema,
    },
    responses: {
      200: {
        description: "List stations",
        content: {
          "application/json": { schema: StationListResponseSchema },
        },
      },
      400: {
        description: "Invalid query",
        content: {
          "application/json": {
            schema: StationErrorResponseSchema,
            examples: {
              InvalidQuery: {
                value: {
                  error: "Invalid query parameters",
                  details: {
                    code: StationErrorCodeSchema.enum.INVALID_DATE_FORMAT,
                    issues: [
                      {
                        path: "query.from",
                        message: "from must be an ISO 8601 datetime string",
                        code: "invalid_string",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getStation: createRoute({
    method: "get",
    path: "/v1/stations/{stationId}",
    request: {
      params: StationIdParamSchema,
    },
    responses: {
      200: {
        description: "Get station details",
        content: {
          "application/json": { schema: StationSummarySchemaOpenApi },
        },
      },
      404: {
        description: "Station not found",
        content: {
          "application/json": {
            schema: StationErrorResponseSchema,
            examples: {
              StationNotFound: {
                value: {
                  error: "Station not found",
                  details: {
                    code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getStationStats: createRoute({
    method: "get",
    path: "/v1/stations/{stationId}/stats",
    request: {
      params: StationIdParamSchema,
      query: StationRevenueQuerySchema,
    },
    responses: {
      200: {
        description: "Station statistics within a date range",
        content: {
          "application/json": { schema: StationStatsResponseSchemaOpenApi },
        },
      },
      400: {
        description: "Invalid date range",
        content: {
          "application/json": {
            schema: StationErrorResponseSchema,
            examples: {
              InvalidDateRange: {
                value: {
                  error: "Invalid date range",
                  details: {
                    code: StationErrorCodeSchema.enum.INVALID_DATE_RANGE,
                    from: "2025-02-10T00:00:00.000Z",
                    to: "2025-02-01T00:00:00.000Z",
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "Station not found",
        content: {
          "application/json": {
            schema: StationErrorResponseSchema,
            examples: {
              StationNotFound: {
                value: {
                  error: "Station not found",
                  details: {
                    code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getAllStationsRevenue: createRoute({
    method: "get",
    path: "/v1/stations/revenue",
    request: {
      query: StationRevenueQuerySchema,
    },
    responses: {
      200: {
        description: "Revenue stats for all stations",
        content: {
          "application/json": { schema: StationRevenueResponseSchemaOpenApi },
        },
      },
      400: {
        description: "Invalid date range",
        content: {
          "application/json": {
            schema: StationErrorResponseSchema,
            examples: {
              InvalidDateRange: {
                value: {
                  error: "Invalid date range",
                  details: {
                    code: StationErrorCodeSchema.enum.INVALID_DATE_RANGE,
                    from: "2025-02-10T00:00:00.000Z",
                    to: "2025-02-01T00:00:00.000Z",
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getBikeRevenueByStation: createRoute({
    method: "get",
    path: "/v1/stations/bike-revenue",
    request: {
      query: StationRevenueQuerySchema,
    },
    responses: {
      200: {
        description: "Revenue grouped by station and bike",
        content: {
          "application/json": { schema: BikeRevenueResponseSchemaOpenApi },
        },
      },
      400: {
        description: "Invalid date range",
        content: {
          "application/json": {
            schema: StationErrorResponseSchema,
            examples: {
              InvalidDateRange: {
                value: {
                  error: "Invalid date range",
                  details: {
                    code: StationErrorCodeSchema.enum.INVALID_DATE_RANGE,
                    from: "2025-02-10T00:00:00.000Z",
                    to: "2025-02-01T00:00:00.000Z",
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getHighestRevenueStation: createRoute({
    method: "get",
    path: "/v1/stations/highest-revenue",
    request: {
      query: StationRevenueQuerySchema,
    },
    responses: {
      200: {
        description: "Top station by revenue",
        content: {
          "application/json": { schema: HighestRevenueStationSchemaOpenApi },
        },
      },
      400: {
        description: "Invalid date range",
        content: {
          "application/json": {
            schema: StationErrorResponseSchema,
            examples: {
              InvalidDateRange: {
                value: {
                  error: "Invalid date range",
                  details: {
                    code: StationErrorCodeSchema.enum.INVALID_DATE_RANGE,
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getNearbyStations: createRoute({
    method: "get",
    path: "/v1/stations/nearby",
    request: {
      query: NearbyStationsQuerySchema,
    },
    responses: {
      200: {
        description: "Stations near a coordinate",
        content: {
          "application/json": { schema: StationListResponseSchema },
        },
      },
      400: {
        description: "Invalid coordinates",
        content: {
          "application/json": {
            schema: StationErrorResponseSchema,
            examples: {
              InvalidCoordinates: {
                value: {
                  error: "Invalid coordinates",
                  details: {
                    code: StationErrorCodeSchema.enum.INVALID_DATE_FORMAT,
                    issues: [
                      {
                        path: "query.latitude",
                        message: "latitude must be a number",
                        code: "invalid_type",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  }),

  getStationAlerts: createRoute({
    method: "get",
    path: "/v1/stations/alerts",
    responses: {
      200: {
        description: "Station alerts",
        content: {
          "application/json": { schema: StationAlertsResponseSchemaOpenApi },
        },
      },
    },
  }),

  getNearestAvailableBike: createRoute({
    method: "get",
    path: "/v1/stations/nearest-available-bike",
    request: {
      query: NearbyStationsQuerySchema,
    },
    responses: {
      200: {
        description: "Nearest available bike",
        content: {
          "application/json": { schema: NearestAvailableBikeSchemaOpenApi },
        },
      },
      404: {
        description: "No available bike found",
        content: {
          "application/json": {
            schema: StationErrorResponseSchema,
            examples: {
              NoAvailableBike: {
                value: {
                  error: "No available bike found",
                  details: {
                    code: StationErrorCodeSchema.enum.NO_AVAILABLE_BIKE_FOUND,
                  },
                },
              },
            },
          },
        },
      },
    },
  }),
} as const;
