import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import HTTP_STATUS from "~/constants/http-status";
import { STATIONS_MESSAGE } from "~/constants/messages";
import type {
  CreateStationReqBody,
  GetStationsReqQuery,
  UpdateStationReqBody,
} from "~/models/requests/stations.requests";
import stationsService from "~/services/stations.services";
import { wrapAsync } from "~/utils/handler";

//create a new station
export const createStationController = wrapAsync(
  async (
    req: Request<ParamsDictionary, any, CreateStationReqBody>,
    res: Response
  ) => {
    const result = await stationsService.createStation(req.body);
    return res.status(HTTP_STATUS.CREATED).json({
      message: STATIONS_MESSAGE.STATION_CREATED_SUCCESSFULLY,
      result,
    });
  }
);

//get a list of stations (paginated)
export const getStationsController = wrapAsync(
  async (
    req: Request<ParamsDictionary, any, any, GetStationsReqQuery>,
    res: Response,
    next: NextFunction
  ) => {
    await stationsService.getAllStations(res, next, req.query);
  }
);

//get station details by ID
export const getStationByIdController = wrapAsync(
  async (req: Request<{ _id: string }>, res: Response) => {
    const stationDetails = await stationsService.getStationDetailsById(req.params._id);
    return res.json({
      message: STATIONS_MESSAGE.GET_STATION_DETAILS_SUCCESSFULLY,
      result: stationDetails,
    });
  }
);

//update a station
export const updateStationController = wrapAsync(
  async (
    req: Request<{ _id: string }, any, UpdateStationReqBody>,
    res: Response
  ) => {
    const result = await stationsService.updateStation(req.params._id, req.body);
    if (!result) {
         return res.status(HTTP_STATUS.NOT_FOUND).json({
            message: STATIONS_MESSAGE.STATION_NOT_FOUND,
        });
    }
    return res.json({
      message: STATIONS_MESSAGE.STATION_UPDATED_SUCCESSFULLY,
      result,
    });
  }
);

//delete a station
export const deleteStationController = wrapAsync(
  async (req: Request<{ _id: string }>, res: Response) => {
    await stationsService.deleteStation(req.params._id);
    return res.status(HTTP_STATUS.OK).json({
      message: STATIONS_MESSAGE.STATION_DELETED_SUCCESSFULLY,
    });
  }
);

export const getNearbyStationsController = wrapAsync(
  async (
    req: Request<ParamsDictionary, any, any, GetStationsReqQuery>,
    res: Response,
    next: NextFunction
  ) => {
    await stationsService.getNearbyStations(res, next, req.query);
  }
);

export const getStationStatsController = wrapAsync(
  async (req: Request<{ id: string }>, res: Response) => {
    const { from, to } = req.query;
    const result = await stationsService.getStationStats(req.params.id, {
      from: from as string,
      to: to as string
    });
    return res.json({
      message: STATIONS_MESSAGE.GET_STATION_STATS_SUCCESSFULLY,
      result,
    });
  }
);

export const getStationAlertsController = wrapAsync(
  async (req: Request, res: Response) => {
    const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : 20; // default 20%
    const result = await stationsService.getStationAlerts(threshold);
    return res.json({
      message: STATIONS_MESSAGE.GET_STATION_ALERTS_SUCCESSFULLY,
      result,
    });
  }
);

export const getAllStationsRevenueController = wrapAsync(
  async (req: Request, res: Response) => {
    const { from, to } = req.query;
    const result = await stationsService.getAllStationsRevenue({
      from: from as string,
      to: to as string
    });
    return res.json({
      message: STATIONS_MESSAGE.GET_STATION_STATS_SUCCESSFULLY,
      result,
    });
  }
);