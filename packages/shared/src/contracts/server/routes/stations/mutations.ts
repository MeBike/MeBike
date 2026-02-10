import { createRoute } from "@hono/zod-openapi";

import {
  CreateStationBodySchema,
  StationErrorCodeSchema,
  StationErrorResponseSchema,
  StationIdParamSchema,
  StationSummarySchemaOpenApi,
  UpdateStationBodySchema,
} from "./shared";

export const createStation = createRoute({
  method: "post",
  path: "/v1/stations",
  tags: ["Stations"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateStationBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Station created successfully",
      content: {
        "application/json": { schema: StationSummarySchemaOpenApi },
      },
    },
    400: {
      description: "Invalid input or duplicate name",
      content: {
        "application/json": {
          schema: StationErrorResponseSchema,
          examples: {
            DuplicateName: {
              value: {
                error: "Station name already exists",
                details: {
                  code: StationErrorCodeSchema.enum.STATION_NAME_ALREADY_EXISTS,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const updateStation = createRoute({
  method: "patch",
  path: "/v1/stations/{stationId}",
  tags: ["Stations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: StationIdParamSchema,
    body: {
      content: {
        "application/json": { schema: UpdateStationBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Station updated successfully",
      content: {
        "application/json": { schema: StationSummarySchemaOpenApi },
      },
    },
    400: {
      description: "Invalid input or duplicate name",
      content: {
        "application/json": { schema: StationErrorResponseSchema },
      },
    },
    404: {
      description: "Station not found",
      content: {
        "application/json": { schema: StationErrorResponseSchema },
      },
    },
  },
});

export const deleteStation = createRoute({
  method: "delete",
  path: "/v1/stations/{stationId}",
  tags: ["Stations"],
  security: [{ bearerAuth: [] }],
  request: {
    params: StationIdParamSchema,
  },
  responses: {
    200: {
      description: "Station deleted successfully",
      content: {
        "application/json": { schema: StationSummarySchemaOpenApi },
      },
    },
    400: {
      description: "Cannot delete station",
      content: {
        "application/json": {
          schema: StationErrorResponseSchema,
          examples: {
            HasBikes: {
              value: {
                error: "Cannot delete station with bikes",
                details: {
                  code: StationErrorCodeSchema.enum.CANNOT_DELETE_STATION_WITH_BIKES,
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
        "application/json": { schema: StationErrorResponseSchema },
      },
    },
  },
});

export const stationsMutations = {
  createStation,
  updateStation,
  deleteStation,
} as const;
