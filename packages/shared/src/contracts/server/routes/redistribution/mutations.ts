import { createRoute } from "@hono/zod-openapi";

import {
  CreateRedistributionRequestSchemaOpenApi,
  createSuccessResponse,
  RedistributionReqErrorCodeSchema,
  RedistributionReqErrorResponseSchema,
  RedistributionRequestSchemaOpenApi,
} from "./shared";
import { forbiddenResponse, unauthorizedResponse } from "../helpers";

export const createRedistributionRequest = createRoute({
  method: "post",
  path: "/v1/staff/redistribution-requests",
  tags: ["RedistributionRequests"],
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
      description: "Cannot create distribution request",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            InsufficientBikes: {
              value: {
                error: "Insufficient available bikes",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .INSUFFICIENT_AVAILABLE_BIKES,
                  requestedQuantity: 15,
                  availableBikes: 10,
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Staff"),
  },
});

export const redistributionReqsMutations = {
  createRedistributionRequest,
} as const;
