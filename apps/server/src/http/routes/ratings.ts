import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { RatingAdminController, RatingMeController } from "@/http/controllers/ratings";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerRatingRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const ratings = serverRoutes.ratings;

  app.openapi(ratings.create, RatingMeController.create);
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

  app.openapi(ratings.getReasons, RatingMeController.getReasons);
  app.openapi(ratings.getBikeSummary, RatingMeController.getBikeSummary);
  app.openapi(ratings.getStationSummary, RatingMeController.getStationSummary);
  app.openapi(ratings.getByRental, RatingMeController.getByRental);
}
