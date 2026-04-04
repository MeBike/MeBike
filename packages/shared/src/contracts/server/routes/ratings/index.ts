import { createRatingRoute } from "./mutations";
import {
  adminGetRatingRoute,
  adminListRatingsRoute,
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
  adminList: adminListRatingsRoute,
  adminGet: adminGetRatingRoute,
  getReasons: getRatingReasonsRoute,
  getBikeSummary: getBikeRatingSummaryRoute,
  getStationSummary: getStationRatingSummaryRoute,
  getByRental: getRatingByRentalRoute,
} as const;
