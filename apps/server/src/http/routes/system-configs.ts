import type { RouteConfig } from "@hono/zod-openapi";
import { serverRoutes } from "@mebike/shared";
import * as SystemConfigsController from "../controllers/system-configs/system-configs.controller";
import { requireAdminMiddleware } from "../middlewares/auth";

export function registerSystemConfigRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const systemConfigs = serverRoutes.systemConfigs;

  const listRoute = {
    ...systemConfigs.getSystemConfigs,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(listRoute, SystemConfigsController.getSystemConfigs);

  const updateRoute = {
    ...systemConfigs.updateSystemConfig,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  app.openapi(updateRoute, SystemConfigsController.updateSystemConfig);
}
