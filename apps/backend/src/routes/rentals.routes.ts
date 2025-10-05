import { Router } from "express";

import { createRentalSessionController, endRentalSessionController } from "~/controllers/rentals.controllers";
import { createRentalSessionValidator, endRentalSessionValidator } from "~/middlewares/rentals.middlewares";
import { wrapAsync } from "~/utils/handler";

const rentalsRouter = Router();

rentalsRouter.route("/start")
  .post(createRentalSessionValidator, wrapAsync(createRentalSessionController));

rentalsRouter.route("/:id/end")
  .put(endRentalSessionValidator, wrapAsync(endRentalSessionController));

export default rentalsRouter;
