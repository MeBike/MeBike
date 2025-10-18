import { Router } from "express";
import { getRentalsByStationIdController } from "~/controllers/rentals.controllers";
import { isAdminAndStaffValidator } from "~/middlewares/admin.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const stationRouter = Router()

// staff: view rental in a station, near-expired reservation
stationRouter.route("/:id/rentals")
.get(accessTokenValidator, isAdminAndStaffValidator, wrapAsync(getRentalsByStationIdController))

export default stationRouter