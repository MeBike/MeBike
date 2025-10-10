import { ObjectId } from "mongodb";

import type { CreateBikeReqBody, GetBikesReqQuery } from "~/models/requests/bikes.requests";

import { BikeStatus } from "~/constants/enums";
import Bike from "~/models/schemas/bike.schema";

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

  async getAllBikes(query: GetBikesReqQuery) {
    const { station_id, status, limit = "10", page = "1" } = query;
    const filter: any = {};

    if (station_id) {
      filter.station_id = new ObjectId(station_id);
    }
    if (status) {
      filter.status = status;
    }

    const limitNumber = Number.parseInt(limit);
    const pageNumber = Number.parseInt(page);
    const skip = (pageNumber - 1) * limitNumber;

    const [bikes, total_bikes] = await Promise.all([
      databaseService.bikes.find(filter).skip(skip).limit(limitNumber).toArray(),
      databaseService.bikes.countDocuments(filter),
    ]);

    return {
      bikes,
      total_bikes,
      total_pages: Math.ceil(total_bikes / limitNumber),
    };
  }
}

const bikesService = new BikesService();
export default bikesService;
