import { createRoute } from "@hono/zod-openapi";

import {
  CancelRedistributionRequestSchemaOpenApi,
  CreateRedistributionRequestSchemaOpenApi,
  createSuccessResponse,
  RedistributionReqErrorCodeSchema,
  RedistributionReqErrorResponseSchema,
  RedistributionRequestDetailSchemaOpenApi,
  RedistributionRequestIdParamSchema,
  RedistributionRequestSchemaOpenApi,
  RejectRedistributionRequestSchemaOpenApi,
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
          userId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
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
                  userId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  sourceStationId: "019b6656-ebc9-7dbc-b0d3-3c62d96042d9",
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
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
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
                  userId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
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
          requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
        },
      },
    }),
  },
});

export const approveRedistributionRequest = createRoute({
  method: "post",
  path: "/v1/manager/redistribution-requests/{requestId}/approve",
  tags: ["Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
  },
  responses: {
    200: {
      description: "Redistribution request approved successfully",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestDetailSchemaOpenApi,
            "Redistribution request approved successfully",
          ),
        },
      },
    },
    400: {
      description: "Redistribution request approval failed",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            CannotApproveNonPendingRedistribution: {
              value: {
                error: "Cannot approve redistribution request that is not in pending state",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .CANNOT_APPROVE_NON_PENDING_REDISTRIBUTION,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
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
      description: "Unauthorized redistribution request approval",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            ...forbiddenResponse("Manager").content["application/json"].examples,
            UnauthorizedRedistributionApproval: {
              value: {
                error: "Unauthorized redistribution approval",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_APPROVAL,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  sourceStationId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  workingStationId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
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
          requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
        },
      },
    }),
  },
});

export const rejectRedistributionRequest = createRoute({
  method: "post",
  path: "/v1/manager/redistribution-requests/{requestId}/reject",
  tags: ["Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: RejectRedistributionRequestSchemaOpenApi,
        }
      }
    }
  },
  responses: {
    200: {
      description: "Redistribution request rejected successfully",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestDetailSchemaOpenApi,
            "Redistribution request rejected successfully",
          ),
        },
      },
    },
    400: {
      description: "Redistribution request rejection failed",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            CannotRejectNonPendingRedistribution: {
              value: {
                error: "Cannot reject redistribution request that is not in pending state",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .CANNOT_REJECT_NON_PENDING_REDISTRIBUTION,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
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
      description: "Unauthorized redistribution request rejection",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            ...forbiddenResponse("Manager").content["application/json"].examples,
            UnauthorizedRedistributionRejection: {
              value: {
                error: "Unauthorized redistribution rejection",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_REJECTION,
                  userId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
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
          requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
        },
      },
    }),
  },
});

export const redistributionReqsMutations = {
  createRedistributionRequest,
  cancelRedistributionRequest,
  approveRedistributionRequest,
  rejectRedistributionRequest,
} as const;
