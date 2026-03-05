import { createRatingRoute } from "./mutations";
import { getRatingByRentalRoute, getRatingReasonsRoute } from "./queries";

export * from "../../ratings/schemas";
export * from "./mutations";
export * from "./queries";

export const ratingsRoutes = {
  create: createRatingRoute,
  getReasons: getRatingReasonsRoute,
  getByRental: getRatingByRentalRoute,
} as const;
