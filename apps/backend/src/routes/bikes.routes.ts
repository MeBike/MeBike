import { Router } from "express";

import { createBikeController, getBikeByIdController, getBikesController } from "~/controllers/bikes.controllers";
import { isAdminValidator } from "~/middlewares/admin.middlewares";
import { bikeIdValidator, createBikeValidator } from "~/middlewares/bikes.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const bikesRouter = Router();

// admin only
bikesRouter.post(
  "/",
  accessTokenValidator,
  isAdminValidator,
  createBikeValidator,
  wrapAsync(createBikeController),
);

bikesRouter.get("/", accessTokenValidator, wrapAsync(getBikesController));

bikesRouter.get(
  "/:_id",
  accessTokenValidator,
  bikeIdValidator,
  wrapAsync(getBikeByIdController)
);
export default bikesRouter;
