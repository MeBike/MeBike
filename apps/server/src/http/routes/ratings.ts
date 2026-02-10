import { serverRoutes } from "@mebike/shared";

import { RatingMeController } from "@/http/controllers/ratings";

export function registerRatingRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const ratings = serverRoutes.ratings;

  app.openapi(ratings.create, RatingMeController.create);
  app.openapi(ratings.getByRental, RatingMeController.getByRental);
}
