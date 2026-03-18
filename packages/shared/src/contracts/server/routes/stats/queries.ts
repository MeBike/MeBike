import { createRoute } from "@hono/zod-openapi";

import {
} from "../../schemas";
import { StatsSummaryResponseSchema } from "../../stats/schemas";
import { forbiddenResponse, unauthorizedResponse } from "../helpers";

export const getStatsSummaryRoute = createRoute({
  method: "get",
  path: "/v1/stats/summary",
  tags: ["Stats"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Admin totals summary",
      content: {
        "application/json": {
          schema: StatsSummaryResponseSchema,
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});
