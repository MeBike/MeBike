import { Router } from "express";

import { adminUpdateBikeController, createBikeController, getBikeByIdController, getBikesController, reportBrokenBikeController } from "~/controllers/bikes.controllers";
import { isAdminAndStaffValidator, isAdminValidator } from "~/middlewares/admin.middlewares";
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

// User reports a broken bike they are renting
bikesRouter.patch(
  "/report-broken/:_id",
  accessTokenValidator,
  bikeIdValidator,
  wrapAsync(reportBrokenBikeController)
);

// Admin/Staff updates a bike's info (status, station_id)
bikesRouter.patch(
  "/admin-update/:_id",
  accessTokenValidator,
  isAdminAndStaffValidator,
  bikeIdValidator,
  updateBikeValidator,
  wrapAsync(adminUpdateBikeController)
);
export default bikesRouter;
