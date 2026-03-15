import { createRatingRoute } from "./mutations";
import {
  getBikeRatingSummaryRoute,
  getRatingByRentalRoute,
  getRatingReasonsRoute,
  getStationRatingSummaryRoute,
} from "./queries";

export * from "../../ratings/schemas";
export * from "./mutations";
export * from "./queries";

export const ratingsRoutes = {
  create: createRatingRoute,
  getReasons: getRatingReasonsRoute,
  getBikeSummary: getBikeRatingSummaryRoute,
  getStationSummary: getStationRatingSummaryRoute,
  getByRental: getRatingByRentalRoute,
} as const;
