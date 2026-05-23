import { createRoute } from "@hono/zod-openapi";
import { ServerErrorResponseSchema } from "../../schemas";
import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  SystemConfigKeyParamSchema,
  SystemConfigSchema,
  UpdateSystemConfigBodySchema,
} from "./shared";

export const updateSystemConfigRoute = createRoute({
  method: "put",
  path: "/v1/admin/system-configs/{key}",
  tags: ["Admin", "System Configs"],
  security: [{ bearerAuth: [] }],
  description: "Update an existing system configuration parameter by key",
  request: {
    params: SystemConfigKeyParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateSystemConfigBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully updated system configuration",
      content: {
        "application/json": {
          schema: SystemConfigSchema,
        },
      },
    },
    400: {
      description: "Invalid configuration value",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Configuration key not found",
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

export const systemConfigsCommands = {
  updateSystemConfig: updateSystemConfigRoute,
} as const;

