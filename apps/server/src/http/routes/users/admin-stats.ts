import { serverRoutes } from "@mebike/shared";

import { AdminUserStatsController } from "@/http/controllers/users";

export function registerAdminUserStatsRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const users = serverRoutes.users;
  app.openapi(users.adminStats, AdminUserStatsController.adminStats);
  app.openapi(users.adminActiveUsers, AdminUserStatsController.adminActiveUsers);
  app.openapi(users.adminTopRenters, AdminUserStatsController.adminTopRenters);
  app.openapi(users.adminNewUsers, AdminUserStatsController.adminNewUsers);
  app.openapi(users.adminDashboardStats, AdminUserStatsController.adminDashboardStats);
}
