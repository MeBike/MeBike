import { createRoute } from "@hono/zod-openapi";

import {
  BikeRevenueResponseSchemaOpenApi,
  HighestRevenueStationSchemaOpenApi,
  NearbyStationsQuerySchema,
  NearestAvailableBikeSchemaOpenApi,
  StationAlertsResponseSchemaOpenApi,
  StationErrorCodeSchema,
  StationErrorResponseSchema,
  StationIdParamSchema,
  StationListQuerySchema,
  StationListResponseSchema,
  StationRevenueQuerySchema,
  StationRevenueResponseSchemaOpenApi,
  StationStatsResponseSchemaOpenApi,
  StationSummarySchemaOpenApi,
} from "./shared";

export const listStations = createRoute({
  method: "get",
  path: "/v1/stations",
  tags: ["Stations"],
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
            InvalidCapacity: {
              value: {
                error: "Invalid query parameters",
                details: {
                  code: StationErrorCodeSchema.enum.INVALID_QUERY_PARAMS,
                  issues: [
                    {
                      path: "query.capacity",
                      message: "Expected number, received string",
                      code: "invalid_type",
                    },
                  ],
                },
              },
            },
            InvalidPage: {
              value: {
                error: "Invalid query parameters",
                details: {
                  code: StationErrorCodeSchema.enum.INVALID_QUERY_PARAMS,
                  issues: [
                    {
                      path: "query.page",
                      message: "Number must be greater than 0",
                      code: "too_small",
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
});

export const getStation = createRoute({
  method: "get",
  path: "/v1/stations/{stationId}",
  tags: ["Stations"],
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
});

export const getStationStats = createRoute({
  method: "get",
  path: "/v1/stations/{stationId}/stats",
  tags: ["Stations"],
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
});

export const getAllStationsRevenue = createRoute({
  method: "get",
  path: "/v1/stations/revenue",
  tags: ["Stations"],
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
});

export const getBikeRevenueByStation = createRoute({
  method: "get",
  path: "/v1/stations/bike-revenue",
  tags: ["Stations"],
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
});

export const getHighestRevenueStation = createRoute({
  method: "get",
  path: "/v1/stations/highest-revenue",
  tags: ["Stations"],
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
});

export const getNearbyStations = createRoute({
  method: "get",
  path: "/v1/stations/nearby",
  tags: ["Stations"],
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
            MissingLatitude: {
              value: {
                error: "Invalid coordinates",
                details: {
                  code: StationErrorCodeSchema.enum.INVALID_COORDINATES,
                  issues: [
                    {
                      path: "query.latitude",
                      message: "Required",
                      code: "invalid_type",
                    },
                  ],
                },
              },
            },
            InvalidLongitude: {
              value: {
                error: "Invalid coordinates",
                details: {
                  code: StationErrorCodeSchema.enum.INVALID_COORDINATES,
                  issues: [
                    {
                      path: "query.longitude",
                      message: "Expected number, received string",
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
});

export const getStationAlerts = createRoute({
  method: "get",
  path: "/v1/stations/alerts",
  tags: ["Stations"],
  responses: {
    200: {
      description: "Station alerts",
      content: {
        "application/json": { schema: StationAlertsResponseSchemaOpenApi },
      },
    },
  },
});

export const getNearestAvailableBike = createRoute({
  method: "get",
  path: "/v1/stations/nearest-available-bike",
  tags: ["Stations"],
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
});
