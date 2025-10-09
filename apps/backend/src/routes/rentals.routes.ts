import { accessTokenValidator } from '~/middlewares/users.middlewares';
import { Router } from "express";

import {
  createRentalSessionController,
  endRentalSessionController,
  getAllRentalsController,
  getDetailRentalController,
  getMyCurrentRentalsController,
  getMyDetailRentalController,
  getMyRentalsController,
  getRentalRevenueController,
  getReservationsStatisticController,
  getStationActivityController,
} from "~/controllers/rentals.controllers";
import { isAdminValidator } from "~/middlewares/admin.middlewares";
import { createRentalSessionValidator, endRentalSessionValidator } from "~/middlewares/rentals.middlewares";
import { wrapAsync } from "~/utils/handler";

const rentalsRouter = Router();

rentalsRouter.route("/stats/revenue")
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getRentalRevenueController));

rentalsRouter.route("/stats/station-activity")
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getStationActivityController));

rentalsRouter.route("/stats/reservations")
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getReservationsStatisticController));

rentalsRouter.route("/me")
  .get(accessTokenValidator, wrapAsync(getMyRentalsController));

rentalsRouter.route("/me/current")
  .get(accessTokenValidator, wrapAsync(getMyCurrentRentalsController));

rentalsRouter.route("/me/:id")
  .get(accessTokenValidator, wrapAsync(getMyDetailRentalController));

rentalsRouter.route("/:id/end")
  .put(accessTokenValidator, endRentalSessionValidator, wrapAsync(endRentalSessionController));

// staff/admin
rentalsRouter.route("/:id")
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getDetailRentalController));

rentalsRouter.route("/")
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getAllRentalsController))
// user
  .post(accessTokenValidator, createRentalSessionValidator, wrapAsync(createRentalSessionController));
export default rentalsRouter;
