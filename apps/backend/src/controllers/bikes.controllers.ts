import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

import type { CreateBikeReqBody, GetBikesReqQuery, UpdateBikeReqBody } from "~/models/requests/bikes.request";
import type { TokenPayLoad } from "~/models/requests/users.requests";

import { BikeStatus, RentalStatus, Role } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { BIKES_MESSAGES } from "~/constants/messages";
import bikesService from "~/services/bikes.services";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import { ObjectId } from "mongodb";

export async function createBikeController(req: Request<ParamsDictionary, any, CreateBikeReqBody>, res: Response) {
  const result = await bikesService.createBike(req.body);
  return res.status(HTTP_STATUS.CREATED).json({
    message: BIKES_MESSAGES.CREATE_BIKE_SUCCESS,
    result,
  });
}

export async function getBikesController(
  req: Request<ParamsDictionary, any, any, GetBikesReqQuery>,
  res: Response,
  next: NextFunction,
) {
  const { role } = req.decoded_authorization as TokenPayLoad;
  const query = req.query;

  // Nếu là user, chỉ cho phép xem xe có sẵn (AVAILABLE)
  if (role === Role.User) {
    query.status = BikeStatus.Available;
  }
  await bikesService.getAllBikes(res, next, query);
}

export async function getBikeByIdController(req: Request, res: Response) {
  const { _id } = req.params;
  const result = await bikesService.getBikeById(_id);
  return res.json({
    message: BIKES_MESSAGES.GET_BIKE_SUCCESS,
    result,
  });
}

export async function updateBikeController(req: Request<ParamsDictionary, any, UpdateBikeReqBody>, res: Response) {
  const { _id: bikeId } = req.params
  const { role, user_id } = req.decoded_authorization as TokenPayLoad
  const payload = req.body

  if (role === Role.User) {
    // 1. User chỉ được phép báo hỏng xe
    const isReportingBroken = payload.status === BikeStatus.Broken
    const hasOtherFields = Object.keys(payload).length > 1 || !payload.status

    if (!isReportingBroken || hasOtherFields) {
      throw new ErrorWithStatus({
        message: BIKES_MESSAGES.USER_CAN_ONLY_REPORT_BROKEN,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // 2. KIỂM TRA XEM USER CÓ ĐANG THUÊ XE NÀY KHÔNG
    const rental = await databaseService.rentals.findOne({
      user_id: new ObjectId(user_id),
      bike_id: new ObjectId(bikeId),
      status: RentalStatus.Ongoing // Giả định trạng thái thuê đang diễn ra là 'Ongoing'
    })

    if (!rental) {
      throw new ErrorWithStatus({
        message: BIKES_MESSAGES.CANNOT_REPORT_BIKE_NOT_RENTING,
        status: HTTP_STATUS.FORBIDDEN
      })
    }
  }
  // Admin và Staff có toàn quyền (đã được validator kiểm tra các giá trị hợp lệ)

  const result = await bikesService.updateBike(bikeId, payload)
  return res.json({
    message: BIKES_MESSAGES.UPDATE_BIKE_SUCCESS,
    result
  })
}