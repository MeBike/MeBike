import { Router } from "express";

import { createBikeController, getBikesController } from "~/controllers/bikes.controllers";
import { isAdminValidator } from "~/middlewares/admin.middlewares";
import { createBikeValidator } from "~/middlewares/bikes.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const bikesRouter = Router();

bikesRouter.post(
  "/",
  accessTokenValidator,
  isAdminValidator,
  createBikeValidator,
  wrapAsync(createBikeController),
);

bikesRouter.get("/", accessTokenValidator, wrapAsync(getBikesController));

export default bikesRouter;
