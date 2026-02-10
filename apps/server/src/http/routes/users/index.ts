import type { OpenAPIHono } from "@hono/zod-openapi";

import { registerAdminUserRoutes } from "./admin";
import { registerAdminUserStatsRoutes } from "./admin-stats";
import { registerUserSelfRoutes } from "./self";

export function registerUserRoutes(app: OpenAPIHono) {
  registerUserSelfRoutes(app);
  registerAdminUserRoutes(app);
  registerAdminUserStatsRoutes(app);
}
