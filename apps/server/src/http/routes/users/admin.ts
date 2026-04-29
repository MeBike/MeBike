import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { AdminUsersController } from "@/http/controllers/users";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerAdminUserRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const users = serverRoutes.users;

  const adminListRoute = {
    ...users.adminList,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminSearchRoute = {
    ...users.adminSearch,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminTechniciansRoute = {
    ...users.adminTechnicians,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminDetailRoute = {
    ...users.adminDetail,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminUpdateRoute = {
    ...users.adminUpdate,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminCreateRoute = {
    ...users.adminCreate,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  const adminResetPasswordRoute = {
    ...users.adminResetPassword,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminListRoute, AdminUsersController.adminList);
  app.openapi(adminSearchRoute, AdminUsersController.adminSearch);
  app.openapi(adminTechniciansRoute, AdminUsersController.adminTechnicians);
  app.openapi(adminDetailRoute, AdminUsersController.adminDetail);
  app.openapi(adminUpdateRoute, AdminUsersController.adminUpdate);
  app.openapi(adminCreateRoute, AdminUsersController.adminCreate);
  app.openapi(adminResetPasswordRoute, AdminUsersController.adminResetPassword);
}
