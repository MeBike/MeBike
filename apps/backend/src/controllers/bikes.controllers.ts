import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

import type { CreateBikeReqBody, GetBikesReqQuery } from "~/models/requests/bikes.requests";
import type { TokenPayLoad } from "~/models/requests/users.requests";

import { Role } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { BIKES_MESSAGES } from "~/constants/messages";
import bikesService from "~/services/bikes.services";

export async function createBikeController(req: Request<ParamsDictionary, any, CreateBikeReqBody>, res: Response) {
  const result = await bikesService.createBike(req.body);
  return res.status(HTTP_STATUS.CREATED).json({
    message: BIKES_MESSAGES.CREATE_BIKE_SUCCESS,
    result,
  });
}

export async function getBikesController(req: Request<ParamsDictionary, any, any, GetBikesReqQuery>, res: Response) {
  const { role } = req.decoded_authorization as TokenPayLoad;
  let query = req.query;

  // Nếu là user, chỉ cho phép xem xe có sẵn (AVAILABLE)
  if (role === Role.User) {
    query.status = "AVAILABLE";
  }

  const result = await bikesService.getAllBikes(query);
  return res.json({
    message: BIKES_MESSAGES.GET_BIKES_SUCCESS,
    result,
  });
}
