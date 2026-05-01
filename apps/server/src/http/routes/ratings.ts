import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { RatingAdminController, RatingMeController } from "@/http/controllers/ratings";
import {
  requireAdminMiddleware,
  requireAuthMiddleware,
} from "@/http/middlewares/auth";

export function registerRatingRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const ratings = serverRoutes.ratings;

  const createRoute = {
    ...ratings.create,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(createRoute, RatingMeController.create);
  const adminListRoute = {
    ...ratings.adminList,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminListRoute, RatingAdminController.adminListRatings);

  const adminGetRoute = {
    ...ratings.adminGet,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminGetRoute, RatingAdminController.adminGetRating);

  const getReasonsRoute = {
    ...ratings.getReasons,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const getBikeSummaryRoute = {
    ...ratings.getBikeSummary,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const getStationSummaryRoute = {
    ...ratings.getStationSummary,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  const getByRentalRoute = {
    ...ratings.getByRental,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(getReasonsRoute, RatingMeController.getReasons);
  app.openapi(getBikeSummaryRoute, RatingMeController.getBikeSummary);
  app.openapi(getStationSummaryRoute, RatingMeController.getStationSummary);
  app.openapi(getByRentalRoute, RatingMeController.getByRental);
}
