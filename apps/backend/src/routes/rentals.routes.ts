import { Router } from "express";

import {
  createRentalSessionController,
  endRentalSessionController,
  getAllRentalsController,
  getBikeUsagesController,
  getDetailRentalController,
  getMyDetailRentalController,
  getMyRentalsController,
  getRentalRevenueController,
  getReservationsStatisticController,
  getStationTrafficController,
} from "~/controllers/rentals.controllers";
import { isAdminOrStaffValidator, isAdminValidator } from "~/middlewares/auth.middlewares";
import { createRentalSessionValidator, endRentalSessionValidator } from "~/middlewares/rentals.middlewares";
import { wrapAsync } from "~/utils/handler";

const rentalsRouter = Router();

rentalsRouter.route("/stats/revenue")
  .get(isAdminValidator, wrapAsync(getRentalRevenueController));

rentalsRouter.route("/stats/bike-usage")
  .get(isAdminValidator, wrapAsync(getBikeUsagesController));

rentalsRouter.route("/stats/station-traffic")
  .get(isAdminValidator, wrapAsync(getStationTrafficController));

rentalsRouter.route("/stats/reservations")
  .get(isAdminValidator, wrapAsync(getReservationsStatisticController));

rentalsRouter.route("/me")
  .get(wrapAsync(getMyRentalsController));

rentalsRouter.route("/me/:id")
  .get(wrapAsync(getMyDetailRentalController));

rentalsRouter.route("/:id/end")
  .put(endRentalSessionValidator, wrapAsync(endRentalSessionController));

// staff/admin
rentalsRouter.route("/:id")
  .get(isAdminOrStaffValidator, wrapAsync(getDetailRentalController));

rentalsRouter.route("/")
  .get(isAdminOrStaffValidator, wrapAsync(getAllRentalsController))
// user
  .post(createRentalSessionValidator, wrapAsync(createRentalSessionController));
export default rentalsRouter;
