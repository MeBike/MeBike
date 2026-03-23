import { serverRoutes } from "@mebike/shared";
import { IncidentPublicController } from "../controllers/incidents";

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
  // app.openapi(incidents.updateIncident, IncidentPublicController.updateIncident);
  // app.openapi(
  //   incidents.updateIncidentStatus,
  //   IncidentPublicController.updateIncidentStatus,
  // );
}
