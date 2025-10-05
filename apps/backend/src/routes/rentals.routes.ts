import { Router } from "express";

import { createRentalSessionController, endRentalSessionController, getDetailRentalController, getMyDetailRentalController, getMyRentalsController } from "~/controllers/rentals.controllers";
import { isAdminOrStaffValidator } from "~/middlewares/auth.middlewares";
import { createRentalSessionValidator, endRentalSessionValidator } from "~/middlewares/rentals.middlewares";
import { wrapAsync } from "~/utils/handler";

const rentalsRouter = Router();

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
  .post(createRentalSessionValidator, wrapAsync(createRentalSessionController));
export default rentalsRouter;
