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
import { getLocalTime } from "~/utils/date-time";
import { ErrorWithStatus } from "~/models/errors";
import HTTP_STATUS from "~/constants/http-status";
import { BikeStatus, RentalStatus } from "~/constants/enums";
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

  async getStationStats(stationId: string, query: { from?: string; to?: string }) {
    const objectId = new ObjectId(stationId);

    //kiểm tra trạm tồn tại
    const station = await databaseService.stations.findOne({ _id: objectId });
    if (!station) {
      throw new ErrorWithStatus({
        message: STATIONS_MESSAGE.STATION_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const startDate = query.from ? new Date(query.from) : new Date('2025-01-01');
    const endDate = query.to ? new Date(query.to) : getLocalTime();

    // Thống kê rentals
    const rentalStats = await databaseService.rentals.aggregate([
      {
        $match: {
          start_station: objectId,
          start_time: { $gte: startDate, $lte: endDate },
          status: RentalStatus.Completed
        }
      },
      {
        $group: {
          _id: null,
          totalRentals: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: '$total_price' } },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]).toArray();

    // Thống kê returns
    const returnStats = await databaseService.rentals.aggregate([
      {
        $match: {
          end_station: objectId,
          end_time: { $gte: startDate, $lte: endDate },
          status: RentalStatus.Completed
        }
      },
      {
        $group: {
          _id: null,
          totalReturns: { $sum: 1 }
        }
      }
    ]).toArray();

    // Thống kê bikes hiện tại
    const currentBikes = await databaseService.bikes.find({ station_id: objectId }).toArray();
    const bikeStatusCounts = currentBikes.reduce((acc, bike) => {
      acc[bike.status] = (acc[bike.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Thống kê reports
    const reportStats = await databaseService.reports.aggregate([
      {
        $match: {
          station_id: objectId,
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const reportsByType = reportStats.reduce((acc, report) => {
      acc[report._id] = report.count;
      return acc;
    }, {} as Record<string, number>);

    // Tính toán utilization rate (đơn vị phút)
    const totalBikes = currentBikes.length;
    const capacity = parseInt(station.capacity, 10);
    const availableMinutes = totalBikes * ((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    const usedMinutes = rentalStats[0]?.totalDuration || 0;
    const utilizationRate = availableMinutes > 0 ? (usedMinutes / availableMinutes) * 100 : 0;

    return {
      station: {
        _id: station._id,
        name: station.name,
        address: station.address,
        capacity: capacity
      },
      period: {
        from: startDate,
        to: endDate
      },
      rentals: {
        totalRentals: rentalStats[0]?.totalRentals || 0,
        totalRevenue: rentalStats[0]?.totalRevenue || 0,
        totalDuration: rentalStats[0]?.totalDuration || 0,
        avgDuration: rentalStats[0]?.avgDuration || 0
      },
      returns: {
        totalReturns: returnStats[0]?.totalReturns || 0
      },
      currentBikes: {
        totalBikes,
        available: bikeStatusCounts[BikeStatus.Available] || 0,
        booked: bikeStatusCounts[BikeStatus.Booked] || 0,
        broken: bikeStatusCounts[BikeStatus.Broken] || 0,
        reserved: bikeStatusCounts[BikeStatus.Reserved] || 0,
        maintained: bikeStatusCounts[BikeStatus.Maintained] || 0,
        unavailable: bikeStatusCounts[BikeStatus.Unavailable] || 0,
        emptySlots: Math.max(0, capacity - totalBikes)
      },
      reports: {
        totalReports: reportStats.reduce((sum, report) => sum + report.count, 0),
        byType: reportsByType
      },
      utilization: {
        rate: Math.round(utilizationRate * 100) / 100,
        availableMinutes: Math.round(availableMinutes * 100) / 100,
        usedMinutes: Math.round(usedMinutes * 100) / 100
      }
    };
  }

  async getStationAlerts(threshold: number = 20) {
    // Lấy tất cả trạm với thông tin xe
    const pipeline: Document[] = [
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
          totalBikes: { $size: "$bikesData" },
          availableBikesCount: {
            $size: {
              $filter: {
                input: "$bikesData",
                as: "bike",
                cond: { $eq: ["$$bike.status", BikeStatus.Available] },
              },
            },
          },
          brokenBikesCount: {
            $size: {
              $filter: {
                input: "$bikesData",
                as: "bike",
                cond: { $eq: ["$$bike.status", BikeStatus.Broken] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          capacity: { $toInt: "$capacity" },
          availableBikes: "$availableBikesCount",
          brokenBikes: "$brokenBikesCount",
          utilizationRate: {
            $cond: [
              { $or: [{ $eq: ["$capacity", 0] }, { $eq: [{ $toDouble: "$capacity" }, 0] }, { $eq: ["$capacity", null] }] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalBikes", { $toDouble: "$capacity" }] },
                  100
                ]
              }
            ]
          },
          emptySlots: {
            $max: [
              0,
              { $subtract: [{ $toDouble: "$capacity" }, "$totalBikes"] }
            ]
          }
        },
      },
      {
        $project: {
          bikesData: 0,
          availableBikesCount: 0,
          brokenBikesCount: 0,
        },
      },
    ];

    const stations = await databaseService.stations.aggregate(pipeline).toArray();

    const alerts = {
      overloaded: [] as any[], // Trạm quá tải (> 90% capacity)
      underloaded: [] as any[], // Trạm thiếu xe (< threshold% available bikes)
      broken: [] as any[], // Trạm có xe hỏng (> 10% broken bikes)
      empty: [] as any[], // Trạm trống (> 50% empty slots)
    };

    for (const station of stations) {
      const capacity = station.capacity;
      const totalBikes = station.totalBikes;
      const availableBikes = station.availableBikes;
      const brokenBikes = station.brokenBikes;
      const emptySlots = station.emptySlots;
      const utilizationRate = station.utilizationRate;

      // Trạm quá tải: > 90% capacity
      if (utilizationRate > 90) {
        alerts.overloaded.push({
          _id: station._id,
          name: station.name,
          address: station.address,
          capacity,
          totalBikes,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          availableBikes,
          emptySlots,
          severity: utilizationRate > 95 ? 'critical' : 'warning'
        });
      }

      // Trạm thiếu xe: < threshold% available bikes
      const availableRate = capacity > 0 ? (availableBikes / capacity) * 100 : 0;
      if (availableRate < threshold) {
        alerts.underloaded.push({
          _id: station._id,
          name: station.name,
          address: station.address,
          capacity,
          totalBikes,
          availableBikes,
          availableRate: Math.round(availableRate * 100) / 100,
          emptySlots,
          severity: availableRate < (threshold / 2) ? 'critical' : 'warning'
        });
      }

      // Trạm có nhiều xe hỏng: > 10% broken bikes
      const brokenRate = totalBikes > 0 ? (brokenBikes / totalBikes) * 100 : 0;
      if (brokenRate > 10) {
        alerts.broken.push({
          _id: station._id,
          name: station.name,
          address: station.address,
          totalBikes,
          brokenBikes,
          brokenRate: Math.round(brokenRate * 100) / 100,
          severity: brokenRate > 20 ? 'critical' : 'warning'
        });
      }

      // Trạm trống: > 50% empty slots
      const emptyRate = capacity > 0 ? (emptySlots / capacity) * 100 : 0;
      if (emptyRate > 50) {
        alerts.empty.push({
          _id: station._id,
          name: station.name,
          address: station.address,
          capacity,
          totalBikes,
          emptySlots,
          emptyRate: Math.round(emptyRate * 100) / 100,
          severity: emptyRate > 70 ? 'critical' : 'warning'
        });
      }
    }

    return {
      threshold,
      totalStations: stations.length,
      alertsCount: {
        overloaded: alerts.overloaded.length,
        underloaded: alerts.underloaded.length,
        broken: alerts.broken.length,
        empty: alerts.empty.length,
        total: alerts.overloaded.length + alerts.underloaded.length + alerts.broken.length + alerts.empty.length
      },
      alerts
    };
  }
}

const stationsService = new StationsService();
export default stationsService;