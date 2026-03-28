import { createRoute } from "@hono/zod-openapi";

import { forbiddenResponse, unauthorizedResponse } from "../helpers";

import {
  AgencyRequestListQuerySchema,
  AgencyRequestListResponseSchema,
  ServerErrorResponseSchema,
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
