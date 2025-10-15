import { Router } from "express";
import { getReservationListController } from "~/controllers/reservations.controllers";
import { wrapAsync } from "~/utils/handler";

const reserveRouter = Router()

reserveRouter.route('/')
.get(wrapAsync(getReservationListController))

export default reserveRouter    