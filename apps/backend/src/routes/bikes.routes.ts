import { Router } from "express";

import { createBikeController, getBikesController } from "~/controllers/bikes.controllers";
import { isAdminValidator } from "~/middlewares/admin.middlewares";
import { createBikeValidator } from "~/middlewares/bikes.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const bikesRouter = Router();

/**
 * Description: Create a new bike (Admin only)
 * Path: /
 * Method: POST
 * Body: { station_id: string, status?: BikeStatus, supplier_id?: string }
 * Header: { Authorization: Bearer <access_token> }
 */
bikesRouter.post(
  "/",
  accessTokenValidator,
  isAdminValidator, // Middleware kiểm tra quyền admin
  createBikeValidator,
  wrapAsync(createBikeController),
);

/**
 * Description: Get list of bikes
 * Path: /
 * Method: GET
 * Query: { station_id?: string, status?: BikeStatus, limit?: string, page?: string }
 * Header: { Authorization: Bearer <access_token> }
 * Logic:
 * - Admin: Can see all bikes and filter by any status.
 * - User: Can only see AVAILABLE bikes.
 */
bikesRouter.get("/", accessTokenValidator, wrapAsync(getBikesController));

export default bikesRouter;
