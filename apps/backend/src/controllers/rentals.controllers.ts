import type { Request, Response } from "express";
import type { NextFunction, ParamsDictionary } from "express-serve-static-core";
import type { Filter, ObjectId } from "mongodb";

import type { GroupByOptions, RentalStatus } from "~/constants/enums";
import type { CreateRentalReqBody, EndRentalReqBody, RentalParams } from "~/models/requests/rentals.requests";
import type Bike from "~/models/schemas/bike.schema";
import type Rental from "~/models/schemas/rental.schema";
import type Station from "~/models/schemas/station.schema";
import type User from "~/models/schemas/user.schema";

import { RENTALS_MESSAGE } from "~/constants/messages";
import databaseService from "~/services/database.services";
import rentalsService from "~/services/rentals.services";
import { sendPaginatedResponse } from "~/utils/pagination.helper";
import { toObjectId } from "~/utils/string";

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

export async function getMyRentalsController(req: Request, res: Response, next: NextFunction) {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const filters: Filter<Rental> = {};
  filters.user_id = user_id;
  if (req.query.start_station) {
    filters.start_station = toObjectId(req.query.start_station.toString());
  }
  if (req.query.end_station) {
    filters.end_station = toObjectId(req.query.end_station.toString());
  }
  if (req.query.status) {
    filters.status = req.query.status as RentalStatus;
  }
  await sendPaginatedResponse(res, next, databaseService.rentals, req.query, filters);
}

export async function getMyDetailRentalController(req: Request<RentalParams>, res: Response) {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await rentalsService.getMyDetailRental({ user_id, rental_id: req.params.id });
  res.json({
    message: RENTALS_MESSAGE.GET_DETAIL_SUCCESS,
    result,
  });
}

// staff/admin only
export async function getAllRentalsController(req: Request, res: Response, next: NextFunction) {
  const filters: Filter<Rental> = {};
  if (req.query.start_station) {
    filters.start_station = toObjectId(req.query.start_station.toString());
  }
  if (req.query.end_station) {
    filters.end_station = toObjectId(req.query.end_station.toString());
  }
  if (req.query.status) {
    filters.status = req.query.status as RentalStatus;
  }
  await sendPaginatedResponse(res, next, databaseService.rentals, req.query, filters);
}

export async function getDetailRentalController(req: Request<RentalParams>, res: Response) {
  const result = await rentalsService.getDetailRental({ rental_id: req.params.id });
  res.json({
    message: RENTALS_MESSAGE.GET_DETAIL_SUCCESS,
    result,
  });
}

export async function getRentalRevenueController(req: Request, res: Response) {
  const { from, to, groupBy } = req.query;
  const result = await rentalsService.getRentalRevenue({
    from: new Date(from as string),
    to: new Date(to as string),
    groupBy: groupBy as GroupByOptions,
  });
  res.json({
    message: RENTALS_MESSAGE.GET_REVENUE_SUCCESS,
    result,
  });
}

export async function getBikeUsagesController(req: Request, res: Response) {
  const { from, to, stationId } = req.query;
  const result = await rentalsService.getBikeUsages({
    from: new Date(from as string),
    to: new Date(to as string),
    stationId: stationId as string,
  });
  res.json({
    message: RENTALS_MESSAGE.GET_BIKE_USAGES_SUCCESS,
    result,
  });
}

export async function getReservationsStatisticController(req: Request, res: Response) {
  const { from, to, groupBy } = req.query;
  const result = await rentalsService.getReservationsStatistic({
    from: new Date(from as string),
    to: new Date(to as string),
    groupBy: groupBy as GroupByOptions,
  });
  res.json({
    message: RENTALS_MESSAGE.GET_RESERVATIONS_SUCCESS,
    result,
  });
}

export async function getStationTrafficController(req: Request, res: Response) {
  const result = await rentalsService.getStationTraffic();
  res.json({
    message: RENTALS_MESSAGE.GET_STATION_TRAFFIC_SUCCESS,
    result,
  });
}
