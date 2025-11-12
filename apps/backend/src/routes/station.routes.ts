import { Router } from "express";
import { getRentalsByStationIdController } from "~/controllers/rentals.controllers";
import { createStationController, deleteStationController, getAllStationsRevenueController, getBikeRevenueByStationController, getHighestRevenueStationController, getNearbyStationsController, getStationAlertsController, getStationByIdController, getStationsController, getStationStatsController, updateStationController } from "~/controllers/stations.controllers";
import { isAdminAndStaffValidator, isAdminValidator } from "~/middlewares/admin.middlewares";
import { createStationValidator, getNearbyStationsValidator, stationIdValidator, updateStationValidator } from "~/middlewares/stations.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const stationRouter = Router()

// staff: view rental in a station, near-expired reservation
stationRouter.route("/:id/rentals")
.get(accessTokenValidator, isAdminAndStaffValidator, wrapAsync(getRentalsByStationIdController))

/**
 * Description: Get detailed statistics for a specific station
 * Path: /stations/:id/stats
 * Method: GET
 * Query: { from?: string, to?: string } - Date format: dd-mm-yyyy or ISO string
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ADMIN
 */
stationRouter.get("/:id/stats", accessTokenValidator, isAdminValidator, wrapAsync(getStationStatsController))

/**
 * Description: Get station alerts (overloaded/underloaded stations)
 * Path: /stations/alerts
 * Method: GET
 * Query: { threshold?: number }
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ADMIN, STAFF
 */
stationRouter.get("/alerts", accessTokenValidator, isAdminAndStaffValidator, wrapAsync(getStationAlertsController))

/**
 * Description: Get revenue statistics for all stations
 * Path: /stations/revenue
 * Method: GET
 * Query: { from?: string, to?: string } - Date format: dd-mm-yyyy or ISO string
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ADMIN
 */
stationRouter.get("/revenue", accessTokenValidator, isAdminValidator, wrapAsync(getAllStationsRevenueController))

/**
 * Description: Get revenue statistics for bikes at each station
 * Path: /stations/bike-revenue
 * Method: GET
 * Query: { from?: string, to?: string } - Date format: dd-mm-yyyy or ISO string
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ADMIN
 */
stationRouter.get("/bike-revenue", accessTokenValidator, isAdminValidator, wrapAsync(getBikeRevenueByStationController))
/**
 * Description: Get the station with the highest revenue
 * Path: /stations/highest-revenue
 * Method: GET
 * Query: { from?: string, to?: string } - Date format: dd-mm-yyyy or ISO string
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ADMIN
 */
stationRouter.get("/highest-revenue", accessTokenValidator, isAdminValidator, wrapAsync(getHighestRevenueStationController));


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
  getNearbyStationsValidator,
  wrapAsync(getNearbyStationsController)
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