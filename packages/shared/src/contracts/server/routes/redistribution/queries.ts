import { createRoute } from "@hono/zod-openapi";
import {
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../helpers";
import {
  AdminRedistributionRequestListQuerySchema,
  createSuccessResponse,
  ManagerRedistributionRequestListQuerySchema,
  RedistributionReqErrorCodeSchema,
  RedistributionReqErrorResponseSchema,
  RedistributionRequestDetailSchemaOpenApi,
  RedistributionRequestIdParamSchema,
  RedistributionRequestListResponseSchema,
  StaffRedistributionRequestListQuerySchema,
} from "./shared";

// Admin paths
export const getRequestListForAdmin = createRoute({
  method: "get",
  path: "/v1/admin/redistribution-requests",
  tags: ["Admin", "Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    query: AdminRedistributionRequestListQuerySchema,
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
  path: "/v1/admin/redistribution-requests/{requestId}",
  tags: ["Admin", "Redistribution Requests"],
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
  tags: ["Staff", "Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    query: StaffRedistributionRequestListQuerySchema,
  },
  responses: {
    200: {
      description: "Redistribution request list (staff view)",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestListResponseSchema,
            "Get redistribution request list response",
          ),
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Staff"),
    404: notFoundResponse({
      schema: RedistributionReqErrorResponseSchema,
      description: "User not found",
      example: {
        error: "User not found",
        details: {
          code: RedistributionReqErrorCodeSchema.enum.USER_NOT_FOUND,
          userId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
        },
      },
    }),
  },
});

export const getRequestDetailForStaff = createRoute({
  method: "get",
  path: "/v1/staff/redistribution-requests/{requestId}",
  tags: ["Staff", "Redistribution Requests"],
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

// Manager paths
export const getRequestListForManager = createRoute({
  method: "get",
  path: "/v1/manager/redistribution-requests",
  tags: ["Manager", "Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ManagerRedistributionRequestListQuerySchema,
  },
  responses: {
    200: {
      description: "Redistribution request list in assigned station",
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
    403: forbiddenResponse("Manager"),
  },
});

export const getRequestDetailForManager = createRoute({
  method: "get",
  path: "/v1/manager/redistribution-requests/{requestId}",
  tags: ["Manager", "Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
  },
  responses: {
    200: {
      description:
        "Detailed redistribution request with all populated data (manager view)",
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
    403: forbiddenResponse("Manager"),
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
