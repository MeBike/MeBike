import { accessTokenValidator } from '~/middlewares/users.middlewares';
import { Router } from "express";

import {
  cancelRentalController,
  createRentalFromCardController,
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
  updateDetailRentalController,
} from "~/controllers/rentals.controllers";
import { isAdminValidator } from "~/middlewares/admin.middlewares";
import { cancelRentalValidator, createRentalSessionValidator, endRentalSessionValidator, updateDetailRentalValidator } from "~/middlewares/rentals.middlewares";
import { wrapAsync } from "~/utils/handler";

const rentalsRouter = Router();

rentalsRouter.route("/stats/revenue")
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getRentalRevenueController));

rentalsRouter.post(
  "/card-rental",
  wrapAsync(createRentalFromCardController)
);

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

rentalsRouter.route("/me/:id/end")
  .put(accessTokenValidator, endRentalSessionValidator, wrapAsync(endRentalSessionController));

rentalsRouter.route("/:id/cancel")
  .post(accessTokenValidator, isAdminValidator, cancelRentalValidator, wrapAsync(cancelRentalController));

// staff/admin
rentalsRouter.route("/:id")
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getDetailRentalController))
  .put(accessTokenValidator, isAdminValidator, updateDetailRentalValidator, wrapAsync(updateDetailRentalController))

rentalsRouter.route("/")
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getAllRentalsController))
// user
  .post(accessTokenValidator, createRentalSessionValidator, wrapAsync(createRentalSessionController));
export default rentalsRouter;
