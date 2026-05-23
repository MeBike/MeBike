import { createRoute } from "@hono/zod-openapi";
import { z } from "../../../../zod";
import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import { SystemConfigSchema } from "./shared";

export const getSystemConfigsRoute = createRoute({
  method: "get",
  path: "/v1/admin/system-configs",
  tags: ["Admin", "System Configs"],
  security: [{ bearerAuth: [] }],
  description: "Get all system configurations",
  responses: {
    200: {
      description: "List of system configurations",
      content: {
        "application/json": {
          schema: z.array(SystemConfigSchema),
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
  },
});

export const systemConfigsQueries = {
  getSystemConfigs: getSystemConfigsRoute,
} as const;
