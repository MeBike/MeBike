import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { EnvironmentPolicyController } from "@/http/controllers/environment";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerEnvironmentRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const environment = serverRoutes.environment;
  const createPolicyRoute = {
    ...environment.createEnvironmentPolicy,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(createPolicyRoute, EnvironmentPolicyController.createPolicy);
}
