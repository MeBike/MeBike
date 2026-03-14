import { createRoute } from "@hono/zod-openapi";

import { StatsSummaryResponseSchema } from "../../stats/schemas";

export const getStatsSummaryRoute = createRoute({
  method: "get",
  path: "/v1/stats/summary",
  tags: ["Stats"],
  responses: {
    200: {
      description: "Totals summary",
      content: {
        "application/json": {
          schema: StatsSummaryResponseSchema,
        },
      },
    },
  },
});
