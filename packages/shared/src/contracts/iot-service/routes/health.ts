import { createRoute } from "@hono/zod-openapi";

import { HealthResponseSchema } from "../schemas";

export const healthRoute = createRoute({
  method: "get",
  path: "/v1/health",
  summary: "Service heartbeat",
  description: "Check the health of the IoT service and retrieve uptime information.",
  tags: ["Health"],
  responses: {
    200: {
      description: "Service is operational.",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});
