import type { NextFunction, Response } from "express";

import { ObjectId } from "mongodb";

import type { CreateBikeReqBody, GetBikesReqQuery, UpdateBikeReqBody } from "~/models/requests/bikes.request";

import { BikeStatus } from "~/constants/enums";
import Bike from "~/models/schemas/bike.schema";
import { sendPaginatedResponse } from "~/utils/pagination.helper";

import databaseService from "./database.services";

class BikesService {
  async createBike(payload: CreateBikeReqBody) {
    const result = await databaseService.bikes.insertOne(
      new Bike({
        station_id: new ObjectId(payload.station_id),
        status: payload.status || BikeStatus.Available,
        supplier_id: payload.supplier_id ? new ObjectId(payload.supplier_id) : null,
      }),
    );
    const bike = await databaseService.bikes.findOne({ _id: result.insertedId });
    return bike;
  }

  async getAllBikes(res: Response, next: NextFunction, query: GetBikesReqQuery) {
    const { station_id, status, supplier_id } = query;
    const filter: any = {};

    if (station_id) {
      filter.station_id = new ObjectId(station_id);
    }
    if (status) {
      filter.status = status;
    }
    if (supplier_id) {
      filter.supplier_id = new ObjectId(supplier_id);
    }

    await sendPaginatedResponse(res, next, databaseService.bikes, query, filter);
  }

  async getBikeById(bikeId: string) {
    const bike = await databaseService.bikes.findOne({ _id: new ObjectId(bikeId) });
    return bike;
  }

  async updateBike(bikeId: string, payload: UpdateBikeReqBody) {
    const updatePayload: any = {}
    if (payload.status) {
      updatePayload.status = payload.status
    }
    if (payload.station_id) {
      updatePayload.station_id = new ObjectId(payload.station_id)
    }
    if (payload.supplier_id) {
      updatePayload.supplier_id = new ObjectId(payload.supplier_id);
    }

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)
    const result = await databaseService.bikes.findOneAndUpdate(
      { _id: new ObjectId(bikeId) },
      {
        $set: {
          ...updatePayload,
          updated_at: localTime
        }
      },
      { returnDocument: 'after' }
    )
    return result
  }

  async deleteBike(bikeId: string) {
    // Luôn thực hiện xóa mềm: cập nhật status thành UNAVAILABLE
    const result = await this.updateBike(bikeId, { status: BikeStatus.Unavailable });
    return { softDelete: true, result };
  }

  async getRentalsByBikeId(res: Response, next: NextFunction, bikeId: string, query: GetBikesReqQuery) {
    const filter = {
      bike_id: new ObjectId(bikeId)
    };

    await sendPaginatedResponse(res, next, databaseService.rentals, query, filter);
  }
}

const bikesService = new BikesService();
export default bikesService;
