import { Router } from "express";
import { getRentalsByStationIdController } from "~/controllers/rentals.controllers";
import { createStationController, deleteStationController, getNearbyStationsController, getStationByIdController, getStationsController, updateStationController } from "~/controllers/stations.controllers";
import { isAdminAndStaffValidator, isAdminValidator } from "~/middlewares/admin.middlewares";
import { createStationValidator, getNearbyStationsValidator, stationIdValidator, updateStationValidator } from "~/middlewares/stations.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const stationRouter = Router()

// staff: view rental in a station, near-expired reservation
stationRouter.route("/:id/rentals")
.get(accessTokenValidator, isAdminAndStaffValidator, wrapAsync(getRentalsByStationIdController))

/**
 * Description: Create a new bike station
 * Path: /stations
 * Method: POST
 * Body: CreateStationReqBody
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ADMIN
 */
stationRouter.post(
  "/",
  accessTokenValidator,
  isAdminValidator,
  createStationValidator,
  wrapAsync(createStationController)
);

/**
 * Description: lấy danh sách xe gần nhất theo tọa độ
 * Path: /stations/nearby
 * Method: GET
 * Query: { latitude: number, longitude: number, maxDistance?: number, page?: number, limit?: number }
 * Roles: Public
 */
stationRouter.get(
  "/nearby",
  getNearbyStationsValidator, // <-- Validator mới
  wrapAsync(getNearbyStationsController) // <-- Controller mới
);

/**
 * Description: Get a list of bike stations (paginated)
 * Path: /stations
 * Method: GET
 * Query: { page?: number, limit?: number }
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ALL Logged In Users
 */
stationRouter.get(
  "/",
//   accessTokenValidator,
  wrapAsync(getStationsController)
);

/**
 * Description: Get details of a specific bike station by ID
 * Path: /stations/:_id
 * Method: GET
 * Params: { _id: string }
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ALL Logged In Users
 */
stationRouter.get(
  "/:_id",
//   accessTokenValidator,
  stationIdValidator,
  wrapAsync(getStationByIdController)
);

/**
 * Description: Update a bike station
 * Path: /stations/:_id
 * Method: PUT
 * Params: { _id: string }
 * Body: UpdateStationReqBody
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ADMIN
 */
stationRouter.put(
  "/:_id",
  accessTokenValidator,
  isAdminValidator,
  stationIdValidator,
  updateStationValidator,
  wrapAsync(updateStationController)
);

/**
 * Description: Delete a bike station
 * Path: /stations/:_id
 * Method: DELETE
 * Params: { _id: string }
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ADMIN
 */
stationRouter.delete(
  "/:_id",
  accessTokenValidator,
  isAdminValidator,
  stationIdValidator,
  wrapAsync(deleteStationController)
);
export default stationRouter