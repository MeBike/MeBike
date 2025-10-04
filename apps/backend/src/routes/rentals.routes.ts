import { Router } from "express";

import { createRentalSessionController } from "~/controllers/rentals.controllers";
import { createRentalSessionValidator } from "~/middlewares/rentals.middlewares";
import { wrapAsync } from "~/utils/handler";

const rentalsRouter = Router();

rentalsRouter.route("/")
  .post(createRentalSessionValidator, wrapAsync(createRentalSessionController));

export default rentalsRouter;
