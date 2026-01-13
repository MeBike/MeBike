import { createRoute, z } from "@hono/zod-openapi";

const HealthResponseSchema = z.object({
  status: z.literal("ok"),
});

export const serverHealthRoute = createRoute({
  method: "get",
  path: "/v1/health",
  tags: ["Health"],
  responses: {
    200: {
      description: "Service health check",
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});
