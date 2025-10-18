import { Filter, ObjectId } from "mongodb";
import type { NextFunction, Response } from "express";

import type {
  CreateStationReqBody,
  GetStationsReqQuery,
  UpdateStationReqBody,
} from "~/models/requests/stations.requests";
import Station from "~/models/schemas/station.schema";
import databaseService from "./database.services";
import { sendPaginatedResponse } from "~/utils/pagination.helper";
import { getLocalTime } from "~/utils/date";
import { ErrorWithStatus } from "~/models/errors";
import HTTP_STATUS from "~/constants/http-status";
import { BikeStatus } from "~/constants/enums";
import { STATIONS_MESSAGE } from "~/constants/messages";

class StationsService {
  async createStation(payload: CreateStationReqBody): Promise<Station> {
    const station = new Station({
      ...payload,
      //chắc chắn capacity lưu dạng string
      capacity: payload.capacity.toString(),
    });

    const result = await databaseService.stations.insertOne(station);
    //lấy inserted document
    const insertedStation = await databaseService.stations.findOne({
      _id: result.insertedId,
    });
    if (!insertedStation) {
      //giải quyết trường hợp chèn thất bại không mong đợi
      throw new ErrorWithStatus({
        message: STATIONS_MESSAGE.FAILED_TO_CREATE_STATION,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
    return insertedStation;
  }

  async getAllStations(
    res: Response,
    next: NextFunction,
    query: GetStationsReqQuery
  ) {
    const filter: Filter<Station> = {};
    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }
    if (query.address) {
      filter.address = { $regex: query.address, $options: 'i' };
    }
    if (query.latitude) {
      filter.latitude = query.latitude;
    }
    if (query.longitude) {
      filter.longitude = query.longitude;
    }
    if (query.capacity) {
      filter.capacity = query.capacity;
    }

    await sendPaginatedResponse(res, next, databaseService.stations, query, filter);
  }

  async getStationDetailsById(stationId: string) {
    const objectId = new ObjectId(stationId);
    const station = await databaseService.stations.findOne({ _id: objectId });

    if (!station) {
      throw new ErrorWithStatus({
        message: STATIONS_MESSAGE.STATION_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    //tính toán available bikes and empty slots
    const totalBikesAtStation = await databaseService.bikes.countDocuments({
      station_id: objectId,
    });
    const availableBikes = await databaseService.bikes.countDocuments({
      station_id: objectId,
      status: BikeStatus.Available,
    });

    //Parse capacity string to number for calculation, handle potential errors
    const capacityNumber = parseInt(station.capacity, 10);
    const emptySlots = Number.isNaN(capacityNumber)
      ? 0 //Default to 0 if capacity is not a valid number string
      : Math.max(0, capacityNumber - totalBikesAtStation);

    return {
      ...station,
      availableBikes,
      emptySlots,
    };
  }

  async updateStation(
    stationId: string,
    payload: UpdateStationReqBody
  ): Promise<Station | null> {
    const updateData: Partial<Station> & { updated_at?: Date } = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.address !== undefined) updateData.address = payload.address;
    if (payload.latitude !== undefined) updateData.latitude = payload.latitude;
    if (payload.longitude !== undefined) updateData.longitude = payload.longitude;
    //đảm bảo capacity được cập nhật dưới dạng chuỗi
    if (payload.capacity !== undefined)
      updateData.capacity = payload.capacity.toString();

    //chỉ cập nhật nếu có trường nào được cung cấp
    if (Object.keys(updateData).length === 0) {
      // trả về station hiện tại nếu không có gì để cập nhật
      return databaseService.stations.findOne({ _id: new ObjectId(stationId) });
    }

    updateData.updated_at = getLocalTime();

    const result = await databaseService.stations.findOneAndUpdate(
      { _id: new ObjectId(stationId) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    return result;
  }

  async deleteStation(stationId: string): Promise<{ deletedCount: number }> {
    const objectId = new ObjectId(stationId);

    //Kiểm tra xem có xe nào ở trạm này không
    const bikesAtStation = await databaseService.bikes.countDocuments({
      station_id: objectId,
    });

    //Nếu có xe, không cho xóa và báo lỗi
    if (bikesAtStation > 0) {
      throw new ErrorWithStatus({
        message: STATIONS_MESSAGE.CANNOT_DELETE_STATION_WITH_BIKES,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    //Nếu không có xe, tiến hành xóa trạm
    const result = await databaseService.stations.deleteOne({
      _id: objectId,
    });

    //Kiểm tra kết quả xóa
    if (result.deletedCount === 0) {
      throw new ErrorWithStatus({
        message: STATIONS_MESSAGE.STATION_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    return { deletedCount: result.deletedCount ?? 0 };
  }
}

const stationsService = new StationsService();
export default stationsService;