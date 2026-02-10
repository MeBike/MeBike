import { createRatingRoute } from "./mutations";
import { getRatingByRentalRoute } from "./queries";

export * from "../../ratings/schemas";
export * from "./mutations";
export * from "./queries";

export const ratingsRoutes = {
  create: createRatingRoute,
  getByRental: getRatingByRentalRoute,
} as const;
