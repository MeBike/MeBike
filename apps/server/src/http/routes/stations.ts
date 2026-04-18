import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  StationAdminController,
  StationPublicController,
  StationStaffController,
} from "@/http/controllers/stations";
import {
  requireAdminMiddleware,
  requireStationScopedOperatorMiddleware,
} from "@/http/middlewares/auth";

export function registerStationRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const stations = serverRoutes.stations;
  const createStationRoute = {
    ...stations.createStation,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminListStationsRoute = {
    ...stations.adminListStations,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const updateStationRoute = {
    ...stations.updateStation,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminListStationsRoute, StationAdminController.listStations);
  app.openapi(createStationRoute, StationAdminController.createStation);
  app.openapi(updateStationRoute, StationAdminController.updateStation);

  app.openapi(stations.listStations, StationPublicController.listStations);

  const staffListStationsRoute = {
    ...stations.staffListStations,
    middleware: [requireStationScopedOperatorMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffListStationsRoute, StationStaffController.staffListStations);

  app.openapi(stations.getAllStationsRevenue, StationPublicController.getAllStationsRevenue);

  app.openapi(stations.getNearbyStations, StationPublicController.getNearbyStations);

  app.openapi(stations.getStation, StationPublicController.getStation);

  const staffGetStationRoute = {
    ...stations.staffGetStation,
    middleware: [requireStationScopedOperatorMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffGetStationRoute, StationStaffController.staffGetStation);
}
