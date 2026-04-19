import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import {
  BikeAgencyController,
  BikeAdminController,
  BikeManagementController,
  BikePublicController,
  BikeStaffController,
  BikeStatsController,
} from "@/http/controllers/bikes";
import {
  requireAdminMiddleware,
  requireAgencyMiddleware,
  requireBackofficeMiddleware,
  requireManagerMiddleware,
  requireStationScopedOperatorMiddleware,
  requireTechnicianMiddleware,
} from "@/http/middlewares/auth";

export function registerBikeRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const bikes = serverRoutes.bikes;
  const createBikeRoute = {
    ...bikes.createBike,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(createBikeRoute, BikeAdminController.createBike);

  app.openapi(bikes.listBikes, BikePublicController.listBikes);

  const staffListBikesRoute = {
    ...bikes.staffListBikes,
    middleware: [requireStationScopedOperatorMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffListBikesRoute, BikeStaffController.staffListBikes);

  const agencyListBikesRoute = {
    ...bikes.agencyListBikes,
    middleware: [requireAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(agencyListBikesRoute, BikeAgencyController.agencyListBikes);

  app.openapi(bikes.updateBike, BikeAdminController.updateBike);

  const managerUpdateBikeStatusRoute = {
    ...bikes.managerUpdateBikeStatus,
    middleware: [requireManagerMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(managerUpdateBikeStatusRoute, BikeManagementController.managerUpdateBikeStatus);

  const agencyUpdateBikeStatusRoute = {
    ...bikes.agencyUpdateBikeStatus,
    middleware: [requireAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(agencyUpdateBikeStatusRoute, BikeManagementController.agencyUpdateBikeStatus);

  const technicianUpdateBikeStatusRoute = {
    ...bikes.technicianUpdateBikeStatus,
    middleware: [requireTechnicianMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(technicianUpdateBikeStatusRoute, BikeManagementController.technicianUpdateBikeStatus);

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

  const staffGetBikeRoute = {
    ...bikes.staffGetBike,
    middleware: [requireStationScopedOperatorMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(staffGetBikeRoute, BikeStaffController.staffGetBike);

  const agencyGetBikeRoute = {
    ...bikes.agencyGetBike,
    middleware: [requireAgencyMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(agencyGetBikeRoute, BikeAgencyController.agencyGetBike);

  // Analytics endpoints implemented above.
}
