import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { AdminUserStatsController } from "@/http/controllers/users";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerAdminUserStatsRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const users = serverRoutes.users;

  const adminStatsRoute = {
    ...users.adminStats,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminActiveUsersRoute = {
    ...users.adminActiveUsers,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminTopRentersRoute = {
    ...users.adminTopRenters,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminNewUsersRoute = {
    ...users.adminNewUsers,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminDashboardStatsRoute = {
    ...users.adminDashboardStats,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminStatsRoute, AdminUserStatsController.adminStats);
  app.openapi(adminActiveUsersRoute, AdminUserStatsController.adminActiveUsers);
  app.openapi(adminTopRentersRoute, AdminUserStatsController.adminTopRenters);
  app.openapi(adminNewUsersRoute, AdminUserStatsController.adminNewUsers);
  app.openapi(adminDashboardStatsRoute, AdminUserStatsController.adminDashboardStats);
}
