import { createRoute } from "@hono/zod-openapi";

import { BikeNotFoundResponseSchema } from "../../bikes";
import {
  BikeActivityStatsResponseSchema,
  BikeErrorCodeSchema,
  BikeErrorResponseSchema,
  BikeIdParamSchema,
  BikeListQuerySchema,
  BikeListResponseSchema,
  BikeRentalHistoryQuerySchema,
  BikeRentalHistoryResponseSchema,
  BikeRentalStatsResponseSchema,
  BikeSummarySchemaOpenApi,
  HighestRevenueBikeResponseSchema,
} from "./shared";

export const listBikes = createRoute({
  method: "get",
  path: "/v1/bikes",
  tags: ["Bikes"],
  request: {
    query: BikeListQuerySchema,
  },
  responses: {
    200: {
      description: "List bikes",
      content: {
        "application/json": { schema: BikeListResponseSchema },
      },
    },
    400: {
      description: "Invalid query",
      content: {
        "application/json": {
          schema: BikeErrorResponseSchema,
          examples: {
            InvalidPage: {
              value: {
                error: "Invalid query parameters",
                details: {
                  code: BikeErrorCodeSchema.enum.INVALID_QUERY_PARAMS,
                  issues: [
                    {
                      path: "page",
                      message: "Invalid input: expected number, received NaN",
                      code: "invalid_type",
                      expected: "number",
                      received: "NaN",
                    },
                  ],
                },
              },
            },
            InvalidPageSize: {
              value: {
                error: "Invalid query parameters",
                details: {
                  code: BikeErrorCodeSchema.enum.INVALID_QUERY_PARAMS,
                  issues: [
                    {
                      path: "pageSize",
                      message: "Invalid input: expected number, received NaN",
                      code: "invalid_type",
                      expected: "number",
                      received: "NaN",
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

export const getBike = createRoute({
  method: "get",
  path: "/v1/bikes/{id}",
  tags: ["Bikes"],
  request: {
    params: BikeIdParamSchema,
  },
  responses: {
    200: {
      description: "Get bike details",
      content: {
        "application/json": { schema: BikeSummarySchemaOpenApi },
      },
    },
    404: {
      description: "Bike not found",
      content: {
        "application/json": { schema: BikeNotFoundResponseSchema },
      },
    },
  },
});

export const getBikeStats = createRoute({
  method: "get",
  path: "/v1/bikes/stats/summary",
  tags: ["Bikes"],
  responses: {
    200: {
      description: "Overall bike stats",
      content: {
        "application/json": { schema: BikeRentalStatsResponseSchema },
      },
    },
  },
});

export const getHighestRevenueBike = createRoute({
  method: "get",
  path: "/v1/bikes/stats/highest-revenue",
  tags: ["Bikes"],
  responses: {
    200: {
      description: "Bike with highest revenue",
      content: {
        "application/json": { schema: HighestRevenueBikeResponseSchema },
      },
    },
  },
});

export const getBikeActivityStats = createRoute({
  method: "get",
  path: "/v1/bikes/{id}/activity-stats",
  tags: ["Bikes"],
  request: {
    params: BikeIdParamSchema,
  },
  responses: {
    200: {
      description: "Activity stats for a bike",
      content: {
        "application/json": { schema: BikeActivityStatsResponseSchema },
      },
    },
    404: {
      description: "Bike not found",
      content: {
        "application/json": { schema: BikeNotFoundResponseSchema },
      },
    },
  },
});

export const getBikeRentalHistory = createRoute({
  method: "get",
  path: "/v1/bikes/{id}/rental-history",
  tags: ["Bikes"],
  request: {
    params: BikeIdParamSchema,
    query: BikeRentalHistoryQuerySchema,
  },
  responses: {
    200: {
      description: "Rental history for a bike",
      content: {
        "application/json": { schema: BikeRentalHistoryResponseSchema },
      },
    },
    404: {
      description: "Bike not found",
      content: {
        "application/json": { schema: BikeNotFoundResponseSchema },
      },
    },
  },
});
