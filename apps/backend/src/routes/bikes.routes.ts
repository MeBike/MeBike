import { Router } from "express";

import { createBikeController, getBikeByIdController, getBikesController, updateBikeController } from "~/controllers/bikes.controllers";
import { isAdminValidator } from "~/middlewares/admin.middlewares";
import { bikeIdValidator, createBikeValidator, updateBikeValidator } from "~/middlewares/bikes.middlewares";
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

// api này dành cho admin và user
// đợi rental của truong le xong
// thì quay lại đây làm api này
bikesRouter.patch(
  "/:_id",
  accessTokenValidator,
  bikeIdValidator,
  updateBikeValidator,
  wrapAsync(updateBikeController)
);
export default bikesRouter;
