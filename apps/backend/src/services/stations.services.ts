import { Document, Filter, ObjectId } from "mongodb";
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
import { sendPaginatedAggregationResponse } from "~/utils/pagination.helper";

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
    //filter
    const filter: Filter<Station> = {};
    if (query.name) {
      filter.name = { $regex: query.name, $options: "i" };
    }
    if (query.address) {
      filter.address = { $regex: query.address, $options: "i" };
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

    //Aggregation Pipeline
    const pipeline: Document[] = [
      { $match: filter },
      {
        $lookup: {
          from: "bikes",
          localField: "_id",
          foreignField: "station_id",
          as: "bikesData",
        },
      },
      {
        $addFields: {
          //Thêm các trường đếm cho từng trạng thái
          totalBikes: { $size: "$bikesData" },
          availableBikesCount: {
            $size: {
              $filter: {
                input: "$bikesData", as: "bike",
                cond: { $eq: ["$$bike.status", BikeStatus.Available] },
              },
            },
          },
          bookedBikesCount: {
            $size: {
              $filter: {
                input: "$bikesData", as: "bike",
                cond: { $eq: ["$$bike.status", BikeStatus.Booked] },
              },
            },
          },
          brokenBikesCount: {
            $size: {
              $filter: {
                input: "$bikesData", as: "bike",
                cond: { $eq: ["$$bike.status", BikeStatus.Broken] },
              },
            },
          },
          reservedBikesCount: {
            $size: {
              $filter: {
                input: "$bikesData", as: "bike",
                cond: { $eq: ["$$bike.status", BikeStatus.Reserved] },
              },
            },
          },
          maintainedBikesCount: {
            $size: {
              $filter: {
                input: "$bikesData", as: "bike",
                cond: { $eq: ["$$bike.status", BikeStatus.Maintained] },
              },
            },
          },
          unavailableBikesCount: {
            $size: {
              $filter: {
                input: "$bikesData", as: "bike",
                cond: { $eq: ["$$bike.status", BikeStatus.Unavailable] },
              },
            },
          },
        },
      },
      {
        //Tính emptySlots và xây dựng mảng bike_statuses
        $addFields: {
          emptySlots: {
            $max: [
              0,
              {
                $subtract: [
                  { $toInt: "$capacity" }, //Chuyển capacity (string) thành integer
                  "$totalBikes",
                ],
              },
            ],
          },
          
          //Tạo mảng bike_statuses
        //   bike_statuses: [
        //     { status: BikeStatus.Available, count: "$availableBikesCount" },
        //     { status: BikeStatus.Booked, count: "$bookedBikesCount" },
        //     { status: BikeStatus.Broken, count: "$brokenBikesCount" },
        //     { status: BikeStatus.Reserved, count: "$reservedBikesCount" },
        //     { status: BikeStatus.Maintained, count: "$maintainedBikesCount" },
        //     { status: BikeStatus.Unavailable, count: "$unavailableBikesCount" },
        //   ],

          //Cập nhật lại các trường đếm chính
          availableBikes: "$availableBikesCount",
          bookedBikes: "$bookedBikesCount",
          brokenBikes: "$brokenBikesCount",
          reservedBikes: "$reservedBikesCount",
          maintainedBikes: "$maintainedBikesCount",
          unavailableBikes: "$unavailableBikesCount",
        },
      },
      {
        //Xóa các trường đếm tạm thời và bikesData
        $project: {
          bikesData: 0, 
          availableBikesCount: 0,
          bookedBikesCount: 0,
          brokenBikesCount: 0,
          reservedBikesCount: 0,
          maintainedBikesCount: 0,
          unavailableBikesCount: 0,
        },
      },
    ];

    await sendPaginatedAggregationResponse(
      res,
      next,
      databaseService.stations,
      query,
      pipeline
    );
  }

  async getStationDetailsById(stationId: string) {
    const objectId = new ObjectId(stationId);
    
    //lấy thông tin trạm
    const station = await databaseService.stations.findOne({ _id: objectId });

    if (!station) {
      throw new ErrorWithStatus({
        message: STATIONS_MESSAGE.STATION_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    //lấy tất cả xe tại trạm (chỉ lấy trường status)
    const bikesAtStation = await databaseService.bikes.find(
      { station_id: objectId },
      { projection: { status: 1 } }
    ).toArray();

    //đếm số lượng cho từng trạng thái
    const statusCounts = new Map<string, number>();
    for (const bike of bikesAtStation) {
      statusCounts.set(bike.status, (statusCounts.get(bike.status) || 0) + 1);
    }

    //lấy tất cả các giá trị từ enum BikeStatus 
    const allStatuses = Object.values(BikeStatus);
    
    //tạo mảng bike_statuses hoàn chỉnh, bao gồm cả count = 0
    // const bike_statuses = allStatuses.map(status => {
    //   const count = statusCounts.get(status) || 0;
    //   return { status, count };
    // });

    const totalBikesAtStation = bikesAtStation.length;
    const availableBikes = statusCounts.get(BikeStatus.Available) || 0;
    const bookedBikes = statusCounts.get(BikeStatus.Booked) || 0;
    const brokenBikes = statusCounts.get(BikeStatus.Broken) || 0;
    const reservedBikes = statusCounts.get(BikeStatus.Reserved) || 0;
    const maintainedBikes = statusCounts.get(BikeStatus.Maintained) || 0;
    const unavailableBikes = statusCounts.get(BikeStatus.Unavailable) || 0;

    //emptySlots
    const capacityNumber = parseInt(station.capacity, 10);
    const emptySlots = Number.isNaN(capacityNumber)
      ? 0
      : Math.max(0, capacityNumber - totalBikesAtStation);

    return {
      ...station,
      totalBikes: totalBikesAtStation,
      availableBikes,
      bookedBikes,
      brokenBikes,
      reservedBikes,
      maintainedBikes,
      unavailableBikes,
      emptySlots,
    //   bike_statuses: bike_statuses,
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

  async getNearbyStations(
  res: Response,
  next: NextFunction,
  query: GetStationsReqQuery
 ) {
  const lat = Number(query.latitude);
  const lng = Number(query.longitude);
  const maxDistance = query.maxDistance ? Number(query.maxDistance) : 20000;//mặc định 20km

  const geoNearStage = {
   $geoNear: {
    near: {
     type: "Point",
     coordinates: [lng, lat],
    },
    distanceField: "distance_meters",//trả về khoảng cách (mét)
    maxDistance: maxDistance,
    spherical: true,
    query: {}, 
    key: "location_geo",
   },
  };

  const lookupStage = {
   $lookup: {
    from: "bikes",
    localField: "_id",
    foreignField: "station_id",
    as: "bikesData",
   },
  };
  
  const addFieldsStage1 = {
   $addFields: {
    totalBikes: { $size: "$bikesData" },
    availableBikesCount: {
     $size: {
      $filter: {
       input: "$bikesData", as: "bike",
       cond: { $eq: ["$$bike.status", BikeStatus.Available] },
      },
     },
    },
    bookedBikesCount: {
     $size: {
      $filter: {
       input: "$bikesData", as: "bike",
       cond: { $eq: ["$$bike.status", BikeStatus.Booked] },
      },
     },
    },
    brokenBikesCount: {
     $size: {
      $filter: {
       input: "$bikesData", as: "bike",
       cond: { $eq: ["$$bike.status", BikeStatus.Broken] },
      },
     },
    },
    reservedBikesCount: {
     $size: {
      $filter: {
       input: "$bikesData", as: "bike",
       cond: { $eq: ["$$bike.status", BikeStatus.Reserved] },
      },
     },
    },
    maintainedBikesCount: {
     $size: {
      $filter: {
       input: "$bikesData", as: "bike",
       cond: { $eq: ["$$bike.status", BikeStatus.Maintained] },
      },
     },
    },
    unavailableBikesCount: {
     $size: {
      $filter: {
       input: "$bikesData", as: "bike",
       cond: { $eq: ["$$bike.status", BikeStatus.Unavailable] },
      },
     },
    },
   },
  };

  const addFieldsStage2 = {
   $addFields: {
    emptySlots: {
     $max: [
      0,
      {
       $subtract: [
        { $toInt: "$capacity" },
        "$totalBikes",
       ],
      },
     ],
    },
    availableBikes: "$availableBikesCount",
    bookedBikes: "$bookedBikesCount",
    brokenBikes: "$brokenBikesCount",
    reservedBikes: "$reservedBikesCount",
    maintainedBikes: "$maintainedBikesCount",
    unavailableBikes: "$unavailableBikesCount",
   },
  };
  
  const projectStage = {
   $project: {
    bikesData: 0, 
    availableBikesCount: 0,
    bookedBikesCount: 0,
    brokenBikesCount: 0,
    reservedBikesCount: 0,
    maintainedBikesCount: 0,
    unavailableBikesCount: 0,
   },
  };

  const pipeline: Document[] = [
   geoNearStage,
   lookupStage,
   addFieldsStage1,
   addFieldsStage2,
   projectStage,
  ];

  await sendPaginatedAggregationResponse(
   res,
   next,
   databaseService.stations,
   query,
   pipeline
  );
 }
}

const stationsService = new StationsService();
export default stationsService;