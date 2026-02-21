import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  StationAdminController,
  StationPublicController,
} from "@/http/controllers/stations";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerStationRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const stations = serverRoutes.stations;
  const createStationRoute = {
    ...stations.createStation,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(createStationRoute, StationAdminController.createStation);

  app.openapi(stations.listStations, StationPublicController.listStations);

  app.openapi(stations.getNearbyStations, StationPublicController.getNearbyStations);

  app.openapi(stations.getStation, StationPublicController.getStation);
}
