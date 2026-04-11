import { createRoute } from "@hono/zod-openapi";
import {
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../helpers";
import {
  AdminRedistributionRequestListQuerySchema,
  AgencyRedistributionRequestListQuerySchema,
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
    403: {
      description: "Unauthorized redistribution request access",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            ...forbiddenResponse("Staff").content["application/json"].examples,
            UnauthorizedRedistributionAccess: {
              value: {
                error: "Unauthorized redistribution access",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_ACCESS,
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
            "Get distribution list response",
          ),
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Manager"),
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
    403: {
      description: "Unauthorized redistribution request access",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            ...forbiddenResponse("Manager").content["application/json"].examples,
            UnauthorizedRedistributionAccess: {
              value: {
                error: "Unauthorized redistribution access",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_ACCESS,
                  userId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  sourceStationId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  targetStationId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
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

// Agency paths
export const getRequestListForAgency = createRoute({
  method: "get",
  path: "/v1/agency/redistribution-requests",
  tags: ["Agency", "Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    query: AgencyRedistributionRequestListQuerySchema,
  },
  responses: {
    200: {
      description: "Redistribution request list in assigned agency",
      content: {
        "application/json": {
          schema: createSuccessResponse(
            RedistributionRequestListResponseSchema,
            "Get distribution list response",
          ),
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Agency"),
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

export const getRequestDetailForAgency = createRoute({
  method: "get",
  path: "/v1/agency/redistribution-requests/{requestId}",
  tags: ["Agency", "Redistribution Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: RedistributionRequestIdParamSchema,
  },
  responses: {
    200: {
      description:
        "Detailed redistribution request with all populated data (agency view)",
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
    403: {
      description: "Unauthorized redistribution request access",
      content: {
        "application/json": {
          schema: RedistributionReqErrorResponseSchema,
          examples: {
            ...forbiddenResponse("Agency").content["application/json"].examples,
            UnauthorizedRedistributionAccess: {
              value: {
                error: "Unauthorized redistribution access",
                details: {
                  code: RedistributionReqErrorCodeSchema.enum
                    .UNAUTHORIZED_ACCESS,
                  userId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  requestId: "019d56cf-e09b-701f-a6cb-ae192a4017b7",
                  sourceStationId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
                  targetStationId: "019d53a7-dbbb-7185-b741-eee4e5664bdb",
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
