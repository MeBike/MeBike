import { createRoute } from "@hono/zod-openapi";

import {
  CreateRedistributionRequestSchemaOpenApi,
  createSuccessResponse,
  RedistributionReqErrorCodeSchema,
  RedistributionReqErrorResponseSchema,
  RedistributionRequestSchemaOpenApi,
} from "./shared";
import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from "../helpers";

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

export const redistributionReqsMutations = {
  createRedistributionRequest,
} as const;
