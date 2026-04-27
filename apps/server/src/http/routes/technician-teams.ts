import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { TechnicianTeamAdminController } from "@/http/controllers/technician-teams";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerTechnicianTeamRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const technicianTeams = serverRoutes.technicianTeams;
  const adminListRoute = {
    ...technicianTeams.adminList,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminAvailableRoute = {
    ...technicianTeams.adminAvailable,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminGetRoute = {
    ...technicianTeams.adminGet,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminCreateRoute = {
    ...technicianTeams.adminCreate,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminUpdateRoute = {
    ...technicianTeams.adminUpdate,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminAvailableRoute, TechnicianTeamAdminController.listAvailableTechnicianTeams);
  app.openapi(adminGetRoute, TechnicianTeamAdminController.getTechnicianTeam);
  app.openapi(adminListRoute, TechnicianTeamAdminController.listTechnicianTeams);
  app.openapi(adminCreateRoute, TechnicianTeamAdminController.createTechnicianTeam);
  app.openapi(adminUpdateRoute, TechnicianTeamAdminController.updateTechnicianTeam);
}
