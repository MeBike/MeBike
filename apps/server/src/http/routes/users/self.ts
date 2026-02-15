import { serverRoutes } from "@mebike/shared";

import { UsersController } from "@/http/controllers/users";

export function registerUserSelfRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const users = serverRoutes.users;
  app.openapi(users.me, UsersController.me);
  app.openapi(users.updateMe, UsersController.updateMe);
  app.openapi(users.changePassword, UsersController.changePassword);
}
