import { createRoute } from "@hono/zod-openapi";
import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  createSuccessResponse,
  RedistributionReqErrorResponseSchema,
  RedistributionRequestDetailSchemaOpenApi,
  RedistributionRequestIdParamSchema,
  RedistributionRequestListQuerySchema,
  RedistributionRequestListResponseSchema,
} from "./shared";

// Admin paths
export const getRequestListForAdmin = createRoute({
  method: "get",
  path: "/v1/admin/redistribution-requests",
  tags: ["Admin", "RedistributionRequests"],
  security: [{ bearerAuth: [] }],
  request: {
    query: RedistributionRequestListQuerySchema,
  },
  responses: {
    200: {
      description: "Redistribution request list (admin view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestListResponseSchema,
            "Get distribution request list response",
          ),
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const getRequestDetailForAdmin = createRoute({
  method: "get",
  path: "/v1/admin/redistribution-requests/{redistributionReqId}",
  tags: ["Admin", "RedistributionRequests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
  },
  responses: {
    200: {
      description:
        "Detailed redistribution request with all populated data (admin view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestDetailSchemaOpenApi,
            "Get detailed distribution request response",
          ),
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: {
      description: "Redistribution request not found",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
        },
      },
    },
  },
});

// Staff paths
export const getRequestListForStaff = createRoute({
  method: "get",
  path: "/v1/staff/redistribution-requests",
  tags: ["Staff", "RedistributionRequests"],
  security: [{ bearerAuth: [] }],
  request: {
    query: RedistributionRequestListQuerySchema,
  },
  responses: {
    200: {
      description: "Redistribution request list (staff view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestListResponseSchema,
            "Get distribution request list response",
          ),
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Staff"),
  },
});

export const getRequestDetailForStaff = createRoute({
  method: "get",
  path: "/v1/staff/redistribution-requests/{redistributionReqId}",
  tags: ["Staff", "RedistributionRequests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
  },
  responses: {
    200: {
      description:
        "Detailed redistribution request with all populated data (staff view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestDetailSchemaOpenApi,
            "Get detailed distribution request response",
          ),
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Staff"),
    404: {
      description: "Redistribution request not found",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
        },
      },
    },
  },
});

// User paths
export const getMyRequestList = createRoute({
  method: "get",
  path: "/v1/redistribution-requests/me",
  tags: ["RedistributionRequests"],
  security: [{ bearerAuth: [] }],
  request: {
    query: RedistributionRequestListQuerySchema,
  },
  responses: {
    200: {
      description: "Redistribution request list (user view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestListResponseSchema,
            "Get distribution request list response",
          ),
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const getMyRequestDetail = createRoute({
  method: "get",
  path: "/v1/redistribution-requests/me/{redistributionReqId}",
  tags: ["RedistributionRequests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
  },
  responses: {
    200: {
      description:
        "Detailed redistribution request with all populated data (user view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestDetailSchemaOpenApi,
            "Get detailed distribution request response",
          ),
        },
      },
    },
    401: unauthorizedResponse(),
    404: {
      description: "Redistribution request not found",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
        },
      },
    },
  },
});
