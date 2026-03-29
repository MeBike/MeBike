import { createRoute } from "@hono/zod-openapi";

import { forbiddenResponse, unauthorizedResponse } from "../helpers";

import {
  AgencyListQuerySchema,
  AgencyListResponseSchema,
  ServerErrorResponseSchema,
} from "./shared";

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
