import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

import type { CreateBikeReqBody, GetBikesReqQuery, UpdateBikeReqBody } from "~/models/requests/bikes.request";
import type { TokenPayLoad } from "~/models/requests/users.requests";

import { BikeStatus, RentalStatus, Role } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { BIKES_MESSAGES, USERS_MESSAGES } from "~/constants/messages";
import bikesService from "~/services/bikes.services";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import { ObjectId } from "mongodb";
import { verifyToken } from "~/utils/jwt";

export async function createBikeController(req: Request<ParamsDictionary, any, CreateBikeReqBody>, res: Response) {
  const result = await bikesService.createBike(req.body);
  return res.status(HTTP_STATUS.CREATED).json({
    message: BIKES_MESSAGES.CREATE_BIKE_SUCCESS,
    result,
  });
}

// export async function getBikesController(
//   req: Request<ParamsDictionary, any, any, GetBikesReqQuery>,
//   res: Response,
//   next: NextFunction,
// ) {
//   const { user_id } = req.decoded_authorization as TokenPayLoad
//   const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
//   if(!user){
//     throw new ErrorWithStatus({
//       message: USERS_MESSAGES.USER_NOT_FOUND,
//       status: HTTP_STATUS.NOT_FOUND
//     })
//   }

//   const { role } = user
//   const query = req.query;

//   // Nếu là user, chỉ cho phép xem xe có sẵn (AVAILABLE)
//   if (role === Role.User) {
//     query.status = BikeStatus.Available;
//   }
//   await bikesService.getAllBikes(res, next, query);
// }
export async function getBikesController(
  req: Request<ParamsDictionary, any, any, GetBikesReqQuery>,
  res: Response,
  next: NextFunction,
) {
  const query = req.query;
  let userRole: Role | null = null;
  let decoded_authorization: TokenPayLoad | null = null;

  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader) {
    const accessToken = authorizationHeader.split(" ")[1];

    if (accessToken) {
      try {
        decoded_authorization = (await verifyToken({
          token: accessToken,
          secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
        })) as TokenPayLoad;
      } catch (error) {
        console.error("Optional token verification failed:", error);
      }
    }
  }

  if (decoded_authorization) {
    const { user_id } = decoded_authorization;
    try {
      const user = await databaseService.users.findOne({
        _id: new ObjectId(user_id),
      });
      if (user) {
        userRole = user.role as Role;
      } else {
         console.warn(`User ${user_id} not found despite valid token.`);
      }
    } catch (dbError) {
        console.error("Database error fetching user role:", dbError);
        userRole = null;
    }
  }
  //nếu là guest (userRole là null)
  //hoặc nếu là User (userRole là Role.User)
  //thì chỉ cho xem xe 'AVAILABLE'
  if (userRole === null || userRole === Role.User) {
    query.status = BikeStatus.Available;
  }
  //nếu là Staff hoặc Admin, không set query.status mặc định.
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

export async function reportBrokenBikeController(req: Request, res: Response) {
  const { _id: bikeId } = req.params
  const { user_id } = req.decoded_authorization as TokenPayLoad

  // Kiểm tra xem user có đang thuê xe này không
  const rental = await databaseService.rentals.findOne({
    user_id: new ObjectId(user_id),
    bike_id: new ObjectId(bikeId),
    status: RentalStatus.Rented
  })

  if (!rental) {
    throw new ErrorWithStatus({
      message: BIKES_MESSAGES.CANNOT_REPORT_BIKE_NOT_RENTING,
      status: HTTP_STATUS.FORBIDDEN
    })
  }

  const result = await bikesService.updateBike(bikeId, { status: BikeStatus.Broken })

  return res.json({
    message: BIKES_MESSAGES.REPORT_BROKEN_BIKE_SUCCESS,
    result
  })
}

// admin/staff cập nhật bike
export async function adminUpdateBikeController(req: Request<ParamsDictionary, any, UpdateBikeReqBody>, res: Response) {
  const { _id: bikeId } = req.params
  const payload = req.body

  const result = await bikesService.updateBike(bikeId, payload)

  return res.json({
    message: BIKES_MESSAGES.UPDATE_BIKE_SUCCESS,
    result
  })
}

export async function deleteBikeController(req: Request, res: Response) {
  const { _id: bikeId } = req.params;
  const result = await bikesService.deleteBike(bikeId);
  return res.json({
    message: BIKES_MESSAGES.DELETE_BIKE_SUCCESS,
    result,
  });
}

export async function getRentalsByBikeIdController(
  req: Request<ParamsDictionary, any, any, GetBikesReqQuery>,
  res: Response,
  next: NextFunction
) {
  const { _id: bikeId } = req.params;
  await bikesService.getRentalsByBikeId(res, next, bikeId, req.query);
}

export async function getBikesStatsController(req: Request, res: Response) {
  const result = await bikesService.getBikesStats();
  return res.json({
    message: BIKES_MESSAGES.GET_BIKE_STATS_SUCCESS,
    result,
  });
}

export async function getBikeStatsByIdController(req: Request, res: Response) {
  const { _id: bikeId } = req.params;
  const result = await bikesService.getBikeStatsById(bikeId);
  return res.json({
    message: BIKES_MESSAGES.GET_BIKE_STATS_SUCCESS,
    result,
  });
}