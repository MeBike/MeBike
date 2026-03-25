import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { IncidentPublicController } from "../controllers/incidents";
import { IncidentTechnicianController } from "../controllers/incidents/technican.controller";
import { requireTechnicianMiddleware } from "../middlewares/auth";

export function registerIncidentRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const incidents = serverRoutes.incidents;

  app.openapi(incidents.listIncidents, IncidentPublicController.listIncidents);
  app.openapi(incidents.getIncident, IncidentPublicController.getIncident);
  app.openapi(
    incidents.createIncident,
    IncidentPublicController.createIncident,
  );
  app.openapi(
    incidents.updateIncident,
    IncidentPublicController.updateIncident,
  );

  const acceptIncidentRoute = {
    ...incidents.acceptIncident,
    middleware: [requireTechnicianMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(acceptIncidentRoute, IncidentTechnicianController.acceptIncident);

  const rejectIncidentRoute = {
    ...incidents.rejectIncident,
    middleware: [requireTechnicianMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(rejectIncidentRoute, IncidentTechnicianController.rejectIncident);

  const startIncidentRoute = {
    ...incidents.startIncident,
    middleware: [requireTechnicianMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(startIncidentRoute, IncidentTechnicianController.startIncident);

  const resolveIncidentRoute = {
    ...incidents.resolveIncident,
    middleware: [requireTechnicianMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(resolveIncidentRoute, IncidentTechnicianController.resolveIncident);
}
