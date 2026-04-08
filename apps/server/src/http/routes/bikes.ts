import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  BikeAdminController,
  BikePublicController,
  BikeStatsController,
} from "@/http/controllers/bikes";
import {
  requireAdminMiddleware,
  requireBackofficeMiddleware,
} from "@/http/middlewares/auth";

export function registerBikeRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const bikes = serverRoutes.bikes;
  const createBikeRoute = {
    ...bikes.createBike,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(createBikeRoute, BikeAdminController.createBike);

  app.openapi(bikes.listBikes, BikePublicController.listBikes);

  app.openapi(bikes.updateBike, BikeAdminController.updateBike);

  app.openapi(bikes.reportBrokenBike, BikePublicController.reportBrokenBike);

  app.openapi(bikes.deleteBike, BikeAdminController.deleteBike);

  const getBikeStatsRoute = {
    ...bikes.getBikeStats,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getBikeStatsRoute, BikeStatsController.getBikeStats);

  const getBikeStatisticsRoute = {
    ...bikes.getBikeStatistics,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getBikeStatisticsRoute, BikeStatsController.getBikeStatistics);

  const getBikeStatsByIdRoute = {
    ...bikes.getBikeStatsById,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getBikeStatsByIdRoute, BikeStatsController.getBikeStatsById);

  const getHighestRevenueBikeRoute = {
    ...bikes.getHighestRevenueBike,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getHighestRevenueBikeRoute, BikeStatsController.getHighestRevenueBike);

  const getBikeActivityStatsRoute = {
    ...bikes.getBikeActivityStats,
    middleware: [requireBackofficeMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getBikeActivityStatsRoute, BikeStatsController.getBikeActivityStats);

  const getBikeRentalHistoryRoute = {
    ...bikes.getBikeRentalHistory,
    middleware: [requireBackofficeMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getBikeRentalHistoryRoute, BikeStatsController.getBikeRentalHistory);

  // Keep single-segment dynamic route last to avoid accidental shadowing
  // if future static endpoints are added under /v1/bikes/*.
  app.openapi(bikes.getBike, BikePublicController.getBike);

  // Analytics endpoints implemented above.
}
