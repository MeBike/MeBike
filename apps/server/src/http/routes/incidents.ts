import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { IncidentPublicController } from "../controllers/incidents";
import { IncidentTechnicianController } from "../controllers/incidents/technican.controller";
import {
  requireAuthMiddleware,
  requireTechnicianMiddleware,
  requireTechnicianOrAdminOrUserMiddleware,
} from "../middlewares/auth";

export function registerIncidentRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const incidents = serverRoutes.incidents;

  const listIncidentsRoute = {
    ...incidents.listIncidents,
    middleware: [requireTechnicianOrAdminOrUserMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(listIncidentsRoute, IncidentPublicController.listIncidents);

  const getIncidentRoute = {
    ...incidents.getIncident,
    middleware: [requireTechnicianOrAdminOrUserMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getIncidentRoute, IncidentPublicController.getIncident);

  const createIncidentRoute = {
    ...incidents.createIncident,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(createIncidentRoute, IncidentPublicController.createIncident);

  const updateIncidentRoute = {
    ...incidents.updateIncident,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(updateIncidentRoute, IncidentPublicController.updateIncident);

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

  app.openapi(
    resolveIncidentRoute,
    IncidentTechnicianController.resolveIncident,
  );
}
