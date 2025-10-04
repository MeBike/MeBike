import { Router } from "express";

import { createRentalSessionController } from "~/controllers/rentals.controllers";
import { wrapAsync } from "~/utils/handler";

const rentalsRouter = Router();

rentalsRouter.route("/")
  .post(wrapAsync(createRentalSessionController));

export default rentalsRouter;
