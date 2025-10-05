import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ObjectId } from "mongodb";

import type { CreateRentalReqBody, EndRentalReqBody, RentalParams } from "~/models/requests/rentals.requests";
import type Bike from "~/models/schemas/bike.schema";
import type Rental from "~/models/schemas/rental.schema";
import type Station from "~/models/schemas/station.schema";
import type User from "~/models/schemas/user.schema";

import { RENTALS_MESSAGE } from "~/constants/messages";
import rentalsService from "~/services/rentals.services";

export async function createRentalSessionController(req: Request<ParamsDictionary, any, CreateRentalReqBody>, res: Response) {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const station = req.station as Station;
  const bike = req.bike as Bike;

  const result = await rentalsService.createRentalSession({
    user_id,
    start_station: station._id as ObjectId,
    bike_id: bike._id as ObjectId,
  });
  res.json({
    message: RENTALS_MESSAGE.CREATE_SESSION_SUCCESS,
    result,
  });
}

export async function endRentalSessionController(req: Request<RentalParams, any, EndRentalReqBody>, res: Response) {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const rental = req.rental! as Rental;

  const result = await rentalsService.endRentalSession({ user_id, rental, end_station: req.body.end_station });
  res.json({
    message: RENTALS_MESSAGE.CREATE_SESSION_SUCCESS,
    result,
  });
}
