import { createRoute } from "@hono/zod-openapi";

import {
  CancelRedistributionRequestSchemaOpenApi,
  CreateRedistributionRequestSchemaOpenApi,
  createSuccessResponse,
  RedistributionReqErrorCodeSchema,
  RedistributionReqErrorResponseSchema,
  RedistributionRequestIdParamSchema,
  RedistributionRequestSchemaOpenApi,
} from "./shared";
import {
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../helpers";

export const createRedistributionRequest = createRoute({
  method: "post",
  path: "/v1/staff/redistribution-requests",
  tags: ["Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateRedistributionRequestSchemaOpenApi,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Redistribution request created successfully",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestSchemaOpenApi,
            "Create redistribution request with validated data",
          ),
        },
      },
    },
    400: {
      description: "Redistribution request created failed",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            NotEnoughBikesAtStation: {
              value: {
                error: "Insufficient available bikes",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .INSUFFICIENT_AVAILABLE_BIKES,
                  required: 15,
                  available: 10,
                },
              },
            },
            NotEnoughEmptySlotsAtTarget: {
              value: {
                error: "Insufficient empty slots at target station",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .INSUFFICIENT_EMPTY_SLOTS,
                  required: 15,
                  available: 10,
                },
              },
            },
            ExceededMinBikesAtStation: {
              value: {
                error:
                  "Source station will have less than minimum bikes after redistribution",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .EXCEEDED_MIN_BIKES_AT_STATION,
                  stationId: "station-id",
                  minBikes: 20,
                  restBikesAfterFulfillment: 15,
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    404: notFoundResponse({
      schema: RedistributionReqErrorResponseSchema,
      description: "User not found",
      example: {
        error: "User not found",
        details: {
          code: RedistributionReqErrorCodeSchema.enum.USER_NOT_FOUND,
          userId: "user-id",
        },
      },
    }),
    403: {
      description: "Unauthorized redistribution request creation",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            ...forbiddenResponse("Staff").content["application/json"].examples,
            UnauthorizedRedistributionCreation: {
              value: {
                error: "Unauthorized redistribution creation",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_CREATION,
                  userId: "user-id",
                  sourceStationId: "station-id",
                },
              },
            },
          },
        },
      },
    },
  },
});

export const cancelRedistributionRequest = createRoute({
  method: "post",
  path: "/v1/staff/redistribution-requests/{requestId}/cancel",
  tags: ["Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: CancelRedistributionRequestSchemaOpenApi,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Redistribution request cancelled successfully",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestSchemaOpenApi,
            "Redistribution request cancelled successfully",
          ),
        },
      },
    },
    400: {
      description: "Redistribution request cancellation failed",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            CannotCancelNonPendingRedistribution: {
              value: {
                error: "Cannot cancel redistribution request that is not in pending state",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .CANNOT_CANCEL_NON_PENDING_REDISTRIBUTION,
                  requestId: "request-id",
                  status: "APPROVED",
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: {
      description: "Unauthorized redistribution request cancellation",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            ...forbiddenResponse("Staff").content["application/json"].examples,
            UnauthorizedRedistributionCancellation: {
              value: {
                error: "Unauthorized redistribution cancellation",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_CANCELLATION,
                  userId: "user-id",
                  requestId: "request-id",
                },
              },
            },
          },
        },
      },
    },
    404: notFoundResponse({
      schema: RedistributionReqErrorResponseSchema,
      description: "Redistribution request not found",
      example: {
        error: "Redistribution request not found",
        details: {
          code: RedistributionReqErrorCodeSchema.enum.REDISTRIBUTION_REQUEST_NOT_FOUND,
          requestId: "request-id",
        },
      },
    }),
  },
});

export const redistributionReqsMutations = {
  createRedistributionRequest,
} as const;
