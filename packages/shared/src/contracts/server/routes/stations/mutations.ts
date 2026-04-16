import { createRoute } from "@hono/zod-openapi";

import {
  CreateStationErrorResponseSchema,
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
          schema: CreateStationErrorResponseSchema,
          examples: {
            DuplicateName: {
              value: {
                error: "Station name already exists",
                details: {
                  code: StationErrorCodeSchema.enum.STATION_NAME_ALREADY_EXISTS,
                },
              },
            },
            CapacityLimitExceeded: {
              value: {
                error: "Station capacity exceeds configured limit",
                details: {
                  code: StationErrorCodeSchema.enum.CAPACITY_LIMIT_EXCEEDED,
                },
              },
            },
            OutsideSupportedArea: {
              value: {
                error: "Coordinates are outside supported service area",
                details: {
                  code: StationErrorCodeSchema.enum.OUTSIDE_SUPPORTED_AREA,
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
        "application/json": {
          schema: StationErrorResponseSchema,
          examples: {
            CapacityBelowActiveUsage: {
              value: {
                error: "Station capacity cannot be lower than bikes and active return slots already assigned",
                details: {
                  code: StationErrorCodeSchema.enum.CAPACITY_BELOW_ACTIVE_USAGE,
                  stationId: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
                  totalCapacity: 2,
                  totalBikes: 2,
                  activeReturnSlots: 1,
                },
              },
            },
            ReturnSlotLimitBelowActiveReservations: {
              value: {
                error: "Return slot limit cannot be lower than active return slots",
                details: {
                  code: StationErrorCodeSchema.enum.RETURN_SLOT_LIMIT_BELOW_ACTIVE_RESERVATIONS,
                  stationId: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
                  returnSlotLimit: 0,
                  activeReturnSlots: 1,
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
