import type { RouteConfig } from "@hono/zod-openapi";

import { IncidentsContracts, serverRoutes } from "@mebike/shared";
import { bodyLimit } from "hono/body-limit";

import { IncidentPublicController } from "../controllers/incidents";
import { IncidentTechnicianController } from "../controllers/incidents/technican.controller";
import {
  requireIncidentActorMiddleware,
  requireIncidentViewerMiddleware,
  requireTechnicianMiddleware,
} from "../middlewares/auth";

export function registerIncidentRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const incidents = serverRoutes.incidents;
  const INCIDENT_IMAGE_REQUEST_MAX_BYTES = 26 * 1024 * 1024;

  function incidentImageTooLargeResponse(c: import("hono").Context) {
    return c.json(
      {
        error: IncidentsContracts.incidentErrorMessages.INCIDENT_IMAGE_TOO_LARGE,
        details: {
          code: IncidentsContracts.IncidentErrorCodeSchema.enum.INCIDENT_IMAGE_TOO_LARGE,
        },
      },
      413,
    );
  }

  const listIncidentsRoute = {
    ...incidents.listIncidents,
    middleware: [requireIncidentViewerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(listIncidentsRoute, IncidentPublicController.listIncidents);

  const getIncidentRoute = {
    ...incidents.getIncident,
    middleware: [requireIncidentViewerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getIncidentRoute, IncidentPublicController.getIncident);

  const createIncidentRoute = {
    ...incidents.createIncident,
    middleware: [requireIncidentActorMiddleware] as const,
  } satisfies RouteConfig;

  const uploadIncidentImagesRoute = {
    ...incidents.uploadIncidentImages,
    middleware: [requireIncidentActorMiddleware] as const,
  } satisfies RouteConfig;

  app.use(incidents.uploadIncidentImages.path, async (c, next) => {
    const contentLength = c.req.header("content-length");
    const parsedLength = contentLength ? Number(contentLength) : null;

    if (
      parsedLength !== null
      && Number.isFinite(parsedLength)
      && parsedLength > INCIDENT_IMAGE_REQUEST_MAX_BYTES
    ) {
      return incidentImageTooLargeResponse(c);
    }

    await next();
  });
  app.use(incidents.uploadIncidentImages.path, bodyLimit({
    maxSize: INCIDENT_IMAGE_REQUEST_MAX_BYTES,
    onError: c => incidentImageTooLargeResponse(c),
  }));
  app.openapi(uploadIncidentImagesRoute, IncidentPublicController.uploadIncidentImages);

  app.openapi(createIncidentRoute, IncidentPublicController.createIncident);

  const updateIncidentRoute = {
    ...incidents.updateIncident,
    middleware: [requireIncidentActorMiddleware] as const,
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
