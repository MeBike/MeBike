import { Router } from "express";

import { adminUpdateBikeController, createBikeController, deleteBikeController, getBikeByIdController, getBikeRentalHistoryController, getBikesController, getBikesStatsController, getBikeStatsByIdController, getRentalsByBikeIdController, reportBrokenBikeController } from "~/controllers/bikes.controllers";
import { isAdminAndStaffValidator, isAdminValidator } from "~/middlewares/admin.middlewares";
import { bikeIdValidator, createBikeValidator, updateBikeValidator } from "~/middlewares/bikes.middlewares";
import { accessTokenValidator, statsPaginationValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const bikesRouter = Router();

// admin only
// tạo xe mới
bikesRouter.post(
  "/",
  accessTokenValidator,
  isAdminValidator,
  createBikeValidator,
  wrapAsync(createBikeController),
);

// user chỉ xem được xe có trạng thái AVAILABLE
// staff, manager, admin có thể xem tất cả các trạng thái
// lấy danh sách xe, có phân trang, lọc theo station_id, status, supplier_id
bikesRouter.get("/", 
  // accessTokenValidator,
   wrapAsync(getBikesController));

// Admin Only Get overall statistics for all bikes
bikesRouter.get(
  "/stats",
  accessTokenValidator,
  isAdminValidator,
  wrapAsync(getBikesStatsController)
);

// admin/staff lấy lịch sử thuê xe theo bike id
bikesRouter.get(
  "/:_id/rentals",
  accessTokenValidator,
  isAdminAndStaffValidator,
  bikeIdValidator,
  wrapAsync(getRentalsByBikeIdController)
);

// admin only get stats for a specific bike by id
bikesRouter.get(
  "/:_id/stats",
  accessTokenValidator,
  isAdminValidator,
  bikeIdValidator,
  wrapAsync(getBikeStatsByIdController)
);

// lấy thông tin chi tiết xe theo id
bikesRouter.get(
  "/:_id",
  // accessTokenValidator,
  bikeIdValidator,
  wrapAsync(getBikeByIdController)
);

// User reports a broken bike they are renting
// Chỉ user mới có quyền báo xe bị hỏng
// người dùng chỉ được báo hỏng xe mà họ đang thuê
bikesRouter.patch(
  "/report-broken/:_id",
  accessTokenValidator,
  bikeIdValidator,
  wrapAsync(reportBrokenBikeController)
);

// Admin/Staff updates a bike's info (status, station_id, supplier_id)
//dùng cho điều phối xe giữa các trạm, sửa trạng thái xe
bikesRouter.patch(
  "/admin-update/:_id",
  accessTokenValidator,
  isAdminAndStaffValidator,
  bikeIdValidator,
  updateBikeValidator,
  wrapAsync(adminUpdateBikeController)
);

/**
 * Description: (Admin/Staff) Get rental history of a specific bike
 * Path: /bikes/:_id/rental-history
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 * Params: { _id: string } (bikeId)
 * Query: { page?: number, limit?: number }
 * Roles: ADMIN, STAFF
 */
bikesRouter.get(
  '/:_id/rental-history',
  accessTokenValidator,
  isAdminAndStaffValidator,
  bikeIdValidator,
  statsPaginationValidator,
  wrapAsync(getBikeRentalHistoryController)
)

// Admin deletes a bike (soft delete)
bikesRouter.delete(
  "/:_id",
  accessTokenValidator,
  isAdminValidator,
  bikeIdValidator,
  wrapAsync(deleteBikeController)
);
export default bikesRouter;
