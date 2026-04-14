import { createRoute } from "@hono/zod-openapi";

import {
  CancelRedistributionRequestSchemaOpenApi,
  ConfirmRedistributionRequestCompletionSchemaOpenApi,
  CreateRedistributionRequestSchemaOpenApi,
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
  path: "/v1/redistribution-requests",
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
          schema: RedistributionRequestSchemaOpenApi
        },
      },
    },
    400: {
      description: "Redistribution request created failed",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            IncompletedRedistributionRequestExists: {
              value: {
                error: "Incompleted redistribution request exists",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .INCOMPLETED_REDISTRIBUTION_REQUEST_EXISTS,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  sourceStationId: "019b6656-ebc9-7dbc-b0d3-3c62d96042d9",
                  status: "PENDING",
                },
              },
            },
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
                  requestedByUserId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  sourceStationId: "019b6656-ebc9-7dbc-b0d3-3c62d96042d9",
                  workingStationId: "019b6656-ebbb-7dbc-74d3-3c62d960e566",
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
  path: "/v1/redistribution-requests/{requestId}/cancel",
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
          schema: RedistributionRequestDetailSchemaOpenApi,
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
            UnauthorizedRedistributionCancellation: {
              value: {
                error: "Unauthorized redistribution cancellation",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_CANCELLATION,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  requestedByUserId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  cancelledByUserId: "019dadf3-dbbb-7185-b741-eee4e592a403",
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
  path: "/v1/redistribution-requests/{requestId}/approve",
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
          schema: RedistributionRequestDetailSchemaOpenApi,
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
                  currentStatus: "APPROVED",
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
            UnauthorizedRedistributionApproval: {
              value: {
                error: "Unauthorized redistribution approval",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_APPROVAL,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  targetStationId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
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
  path: "/v1/redistribution-requests/{requestId}/reject",
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
          schema: RedistributionRequestDetailSchemaOpenApi,
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
                  currentStatus: "APPROVED",
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
            UnauthorizedRedistributionRejection: {
              value: {
                error: "Unauthorized redistribution rejection",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_REDISTRIBUTION_REJECTION,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  targetStationId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  workingStationId: "019d432f-dbbb-7185-b741-eee4e5662134",
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

export const startTransition = createRoute({
  method: "post",
  path: "/v1/redistribution-requests/{requestId}/start-transit",
  tags: ["Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
  },
  responses: {
    200: {
      description: "Redistribution request started transit successfully",
      content: {
        "application/json": {
          schema: RedistributionRequestDetailSchemaOpenApi,
        },
      },
    },
    400: {
      description: "Redistribution request start transit failed",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            CannotStartTransitionNonApprovedRedistribution: {
              value: {
                error: "Cannot start transit redistribution request that is not in approved state",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .CANNOT_START_TRANSIT_NON_APPROVED_REDISTRIBUTION,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  currentStatus: "PENDING",
                },
              },
            },
            NoBikesInRedistributionRequest: {
              value: {
                error: "No bikes in redistribution request",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .NO_BIKES_IN_REDISTRIBUTION_REQUEST,
                  requestId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                },
              },
            },
            NotEnoughEmptySlotsAtTarget: {
              value: {
                error: "Not enough empty slots at target station",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .INSUFFICIENT_EMPTY_SLOTS,
                  targetId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  required: 10,
                  available: 5,
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: {
      description: "Unauthorized redistribution request start transit",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            UnauthorizedRedistributionStartTransit: {
              value: {
                error: "Unauthorized redistribution start transit",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_START_TRANSITION,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  requestedByUserId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  startedByUserId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
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

export const confirmRedistributionRequestCompletion = createRoute({
  method: "post",
  path: "/v1/redistribution-requests/{requestId}/confirm-completion",
  tags: ["Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: ConfirmRedistributionRequestCompletionSchemaOpenApi
        }
      }
    }
  },
  responses: {
    200: {
      description: "Redistribution request completed successfully",
      content: {
        "application/json": {
          schema: RedistributionRequestDetailSchemaOpenApi,
        },
      },
    },
    400: {
      description: "Redistribution request completion failed",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            CannotConfirmNonTransitedRedistribution: {
              value: {
                error: "Cannot confirm redistribution request that is not in transit or partially completed state",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .CANNOT_COMPLETE_NON_TRANSIT_OR_PARTIALLY_COMPLETED_REDISTRIBUTION,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  status: "APPROVED",
                },
              },
            },
            InvalidBikeIdsForRedistributionCompletion: {
              value: {
                error: "Invalid bike ids for redistribution completion",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .INVALID_BIKE_IDS_FOR_REDISTRIBUTION_COMPLETION,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  providedBikeIds: ["bike-1", "bike-2"],
                  unconfirmedBikeIds: ["bike-3", "bike-4"],
                },
              },
            },
            NotEnoughEmptySlotsAtTarget: {
              value: {
                error: "Not enough empty slots at target station",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .INSUFFICIENT_EMPTY_SLOTS,
                  targetId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  required: 10,
                  available: 5,
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: {
      description: "Unauthorized completed redistribution request confirmation",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            UnauthorizedCompletedRedistributionConfirmation: {
              value: {
                error: "Unauthorized completed redistribution confirmation",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_COMPLETED_REDISTRIBUTION_CONFIRMATION,
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  targetStationId: "019d53a7-dbbb-7185-b741-ae192a4017b4",
                  workingStationId: "019d432f-dbbb-7185-b741-eee4e5662134",
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
