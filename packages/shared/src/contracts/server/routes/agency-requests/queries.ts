import { createRoute } from "@hono/zod-openapi";

import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from "../helpers";

import {
  AgencyRequestDetailResponseSchema,
  AgencyRequestErrorCodeSchema,
  AgencyRequestErrorResponseSchema,
  AgencyRequestIdParamSchema,
  AgencyRequestListQuerySchema,
  AgencyRequestListResponseSchema,
  ServerErrorResponseSchema,
  agencyRequestErrorMessages,
} from "./shared";

export const adminListAgencyRequestsRoute = createRoute({
  method: "get",
  path: "/v1/admin/agency-requests",
  tags: ["Admin", "Agency Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    query: AgencyRequestListQuerySchema,
  },
  responses: {
    200: {
      description: "List agency registration requests for admin review",
      content: {
        "application/json": {
          schema: AgencyRequestListResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid query",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const adminGetAgencyRequestRoute = createRoute({
  method: "get",
  path: "/v1/admin/agency-requests/{id}",
  tags: ["Admin", "Agency Requests"],
  security: [{ bearerAuth: [] }],
  request: {
    params: AgencyRequestIdParamSchema,
  },
  responses: {
    200: {
      description: "Get agency request details for admin review",
      content: {
        "application/json": {
          schema: AgencyRequestDetailResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path parameter",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
          examples: {
            InvalidAgencyRequestId: {
              value: {
                error: "Invalid request payload",
                details: {
                  code: "VALIDATION_ERROR",
                  issues: [
                    {
                      path: "params.id",
                      message: "Invalid UUID",
                      code: "invalid_format",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    404: notFoundResponse({
      description: "Agency request not found",
      schema: AgencyRequestErrorResponseSchema,
      example: {
        error: agencyRequestErrorMessages.AGENCY_REQUEST_NOT_FOUND,
        details: {
          code: AgencyRequestErrorCodeSchema.enum.AGENCY_REQUEST_NOT_FOUND,
          agencyRequestId: "0195e4f7-f7d3-7b7a-8fd8-5f2df87fd301",
        },
      },
    }),
  },
});
