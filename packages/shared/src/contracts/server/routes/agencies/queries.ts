import { createRoute } from "@hono/zod-openapi";

import { forbiddenResponse, notFoundResponse, unauthorizedResponse } from "../helpers";

import {
  AgencyDetailResponseSchema,
  AgencyErrorCodeSchema,
  AgencyErrorResponseSchema,
  AgencyIdParamSchema,
  AgencyListQuerySchema,
  AgencyListResponseSchema,
  ServerErrorResponseSchema,
  agencyErrorMessages,
} from "./shared";

export const adminGetAgencyRoute = createRoute({
  method: "get",
  path: "/v1/admin/agencies/{id}",
  tags: ["Admin", "Agencies"],
  security: [{ bearerAuth: [] }],
  request: {
    params: AgencyIdParamSchema,
  },
  responses: {
    200: {
      description: "Get agency details",
      content: {
        "application/json": {
          schema: AgencyDetailResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid path parameter",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
          examples: {
            InvalidAgencyId: {
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
      description: "Agency not found",
      schema: AgencyErrorResponseSchema,
      example: {
        error: agencyErrorMessages.AGENCY_NOT_FOUND,
        details: {
          code: AgencyErrorCodeSchema.enum.AGENCY_NOT_FOUND,
          agencyId: "019b17bd-d130-7e7d-be69-91ceef7b9003",
        },
      },
    }),
  },
});

export const adminListAgenciesRoute = createRoute({
  method: "get",
  path: "/v1/admin/agencies",
  tags: ["Admin", "Agencies"],
  security: [{ bearerAuth: [] }],
  request: {
    query: AgencyListQuerySchema,
  },
  responses: {
    200: {
      description: "List agencies",
      content: {
        "application/json": {
          schema: AgencyListResponseSchema,
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
