import { serverRoutes } from "@mebike/shared";

import { AgencyRequestsController } from "@/http/controllers/agency-requests.controller";

export function registerAgencyRequestRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const agencyRequests = serverRoutes.agencyRequests;
  app.openapi(agencyRequests.submit, AgencyRequestsController.submit);
}
