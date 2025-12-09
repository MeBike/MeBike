import { createRoute } from "@hono/zod-openapi";

import { z } from "../../../zod";
import { ServerErrorResponseSchema } from "../schemas";
import {
  StationDateRangeQuerySchema,
  StationErrorCodeSchema,
  StationErrorDetailSchema,
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

const StationSummarySchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    address: z.string(),
    capacity: z.number(),
  })
  .openapi("StationSummary");

const StationListResponseSchema = z
  .object({
    data: z.array(StationSummarySchema),
  })
  .openapi("StationListResponse", {
    description: "Simplified station listing",
  });

const StationStatsResponseSchema = z
  .object({
    station: StationSummarySchema,
    period: z.object({
      from: z.string(),
      to: z.string(),
    }),
    rentals: z.object({
      totalRentals: z.number(),
      totalRevenue: z.number(),
      totalDuration: z.number(),
      avgDuration: z.number(),
    }),
    returns: z.object({
      totalReturns: z.number(),
    }),
    currentBikes: z.record(z.string(), z.any()),
    reports: z.record(z.string(), z.number()),
    utilizationRate: z.number(),
  })
  .openapi("StationStatsResponse");

const StationRevenueResponseSchema = z
  .object({
    period: z.object({
      from: z.string(),
      to: z.string(),
    }),
    summary: z.object({
      totalStations: z.number(),
      totalRevenue: z.number(),
      totalRevenueFormatted: z.string(),
      totalRentals: z.number(),
    }),
    stations: z.array(
      z.object({
        _id: z.string(),
        name: z.string(),
        address: z.string(),
        totalRevenue: z.number(),
        totalRevenueFormatted: z.string(),
        totalRentals: z.number(),
        totalDuration: z.number(),
        totalDurationFormatted: z.string(),
        avgDuration: z.number(),
        avgDurationFormatted: z.string(),
      }),
    ),
  })
  .openapi("StationRevenueResponse");

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
          "application/json": { schema: StationSummarySchema },
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
          "application/json": { schema: StationStatsResponseSchema },
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
          "application/json": { schema: StationRevenueResponseSchema },
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
          "application/json": { schema: StationRevenueResponseSchema },
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
          "application/json": { schema: StationRevenueResponseSchema },
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
          "application/json": { schema: z.any() },
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
          "application/json": { schema: z.any() },
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
