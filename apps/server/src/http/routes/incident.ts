import { serverRoutes } from "@mebike/shared";

export function registerIncidentRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const incidents = serverRoutes.incidents;

  app.openapi(incidents.listIncidents, IncidentController.listIncidents);
  app.openapi(incidents.getIncident, IncidentController.getIncident);
  app.openapi(incidents.createIncident, IncidentController.createIncident);
  app.openapi(incidents.updateIncident, IncidentController.updateIncident);
  app.openapi(incidents.updateIncidentStatus, IncidentController.updateIncidentStatus);
}
