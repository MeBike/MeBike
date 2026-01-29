import { serverRoutes } from "@mebike/shared";

import { AdminUsersController } from "@/http/controllers/users";

export function registerAdminUserRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const users = serverRoutes.users;
  app.openapi(users.adminList, AdminUsersController.adminList);
  app.openapi(users.adminSearch, AdminUsersController.adminSearch);
  app.openapi(users.adminDetail, AdminUsersController.adminDetail);
  app.openapi(users.adminUpdate, AdminUsersController.adminUpdate);
  app.openapi(users.adminCreate, AdminUsersController.adminCreate);
  app.openapi(users.adminResetPassword, AdminUsersController.adminResetPassword);
}
