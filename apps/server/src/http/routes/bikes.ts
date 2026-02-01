import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  BikeAdminController,
  BikePublicController,
  BikeStatsController,
} from "@/http/controllers/bikes";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerBikeRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const bikes = serverRoutes.bikes;
  const createBikeRoute = {
    ...bikes.createBike,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(createBikeRoute, BikeAdminController.createBike);

  app.openapi(bikes.listBikes, BikePublicController.listBikes);

  app.openapi(bikes.getBike, BikePublicController.getBike);

  app.openapi(bikes.updateBike, BikeAdminController.updateBike);

  app.openapi(bikes.reportBrokenBike, BikePublicController.reportBrokenBike);

  app.openapi(bikes.deleteBike, BikeAdminController.deleteBike);

  app.openapi(bikes.getBikeStats, BikeStatsController.getBikeStats);

  app.openapi(bikes.getHighestRevenueBike, BikeStatsController.getHighestRevenueBike);

  app.openapi(bikes.getBikeActivityStats, BikeStatsController.getBikeActivityStats);

  app.openapi(bikes.getBikeRentalHistory, BikeStatsController.getBikeRentalHistory);

  // Analytics endpoints implemented above.
}
