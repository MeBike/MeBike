import type { NextFunction, Response } from "express";

import { ObjectId } from "mongodb";

import type { CreateBikeReqBody, GetBikesReqQuery, UpdateBikeReqBody } from "~/models/requests/bikes.request";

import { BikeStatus, RentalStatus, ReservationStatus } from "~/constants/enums";
import Bike from "~/models/schemas/bike.schema";
import { sendPaginatedResponse } from "~/utils/pagination.helper";

import databaseService from "./database.services";
import { BIKES_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import HTTP_STATUS from "~/constants/http-status";

class BikesService {
  async createBike(payload: CreateBikeReqBody) {
    const result = await databaseService.bikes.insertOne(
      new Bike({
        chip_id: payload.chip_id,
        station_id: new ObjectId(payload.station_id),
        status: payload.status || BikeStatus.Available,
        supplier_id: payload.supplier_id ? new ObjectId(payload.supplier_id) : null,
      }),
    );
    const bike = await databaseService.bikes.findOne({ _id: result.insertedId });
    return bike;
  }

  async getAllBikes(res: Response, next: NextFunction, query: GetBikesReqQuery) {
    const { station_id, status, supplier_id, chip_id } = query;
    const filter: any = {};

    if (chip_id) {
        filter.chip_id = chip_id;
    }
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
    if (payload.chip_id) {
      updatePayload.chip_id = payload.chip_id
    }
    if (payload.status) {
      updatePayload.status = payload.status
    }
    if (payload.station_id) {
      const currentBike = await databaseService.bikes.findOne({ _id: new ObjectId(bikeId) });
      if (!currentBike) {
        throw new ErrorWithStatus({
          message: BIKES_MESSAGES.BIKE_NOT_FOUND || "Bike not found",
          status: HTTP_STATUS.NOT_FOUND
        });
      }
      //Xe đang được thuê (Booked)
      if (currentBike.status === BikeStatus.Booked) {
        throw new ErrorWithStatus({
          message: BIKES_MESSAGES.CANNOT_UPDATE_STATION_WHILE_RENTED,
          status: HTTP_STATUS.BAD_REQUEST
        });
      }

      //Xe đang có reservation pending
      const activeReservation = await databaseService.reservations.findOne({
        bike_id: new ObjectId(bikeId),
        status: ReservationStatus.Pending
      });
      if (activeReservation) {
        throw new ErrorWithStatus({
          message: BIKES_MESSAGES.CANNOT_UPDATE_STATION_WHILE_RESERVED,
          status: HTTP_STATUS.BAD_REQUEST
        });
      }
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
    const objBikeId = new ObjectId(bikeId);

    const activeRental = await databaseService.rentals.findOne({
      bike_id: objBikeId,
      status: RentalStatus.Rented
    })
    if (activeRental) {
      throw new ErrorWithStatus({
        message: BIKES_MESSAGES.CANNOT_DELETE_BIKE_WHILE_RENTED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const activeReservation = await databaseService.reservations.findOne({
      bike_id: objBikeId,
      status: ReservationStatus.Pending
    })
    if (activeReservation) {
      throw new ErrorWithStatus({
        message: BIKES_MESSAGES.CANNOT_DELETE_BIKE_WHILE_RESERVED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const result = await this.updateBike(bikeId, { status: BikeStatus.Unavailable });
    return { softDelete: true, result };
  }

  async getRentalsByBikeId(res: Response, next: NextFunction, bikeId: string, query: GetBikesReqQuery) {
    const filter = {
      bike_id: new ObjectId(bikeId)
    };

    await sendPaginatedResponse(res, next, databaseService.rentals, query, filter);
  }

  async getBikesStats() {
    const stats = await databaseService.bikes.aggregate([
      // Group by status and count
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      // Reshape the output
      {
        $group: {
          _id: null,
          total_by_status: {
            $push: {
              k: "$_id",
              v: "$count"
            }
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: { $arrayToObject: "$total_by_status" }
        }
      }
    ]).toArray();

    return stats[0] || {};
  }

  async getBikeStatsById(bikeId: string) {
    const bikeStats = await databaseService.rentals.aggregate([
      // Filter for the specific bike
      {
        $match: {
          bike_id: new ObjectId(bikeId)
        }
      },
      // Group and calculate stats
      {
        $group: {
          _id: "$bike_id",
          total_rentals: { $sum: 1 },
          total_revenue: { $sum: { $toDouble: "$total_price" } }, // Convert Decimal128 to double for summation
          total_duration_minutes: { $sum: "$duration" } // duration is in minutes
        }
      }
    ]).toArray();

    const reportCount = await databaseService.reports.countDocuments({
      bike_id: new ObjectId(bikeId)
    });

    if (bikeStats.length === 0) {
      return {
        total_rentals: 0,
        total_revenue: 0,
        total_duration_minutes: 0,
        total_reports: reportCount
      };
    }

    return {
      ...bikeStats[0],
      total_reports: reportCount
    };
  }

  async getBikeRentalHistory(bikeId: string, page: number, limit: number) {
    const objBikeId = new ObjectId(bikeId)
    const skip = (page - 1) * limit

    const pipeline = [
      {
        //Lọc các chuyến đi ĐÃ HOÀN THÀNH của xe này
        $match: {
          bike_id: objBikeId,
          status: RentalStatus.Completed
        }
      },
      {
        //Sắp xếp mới nhất lên đầu
        $sort: {
          end_time: -1 //Sắp xếp theo thời gian trả xe
        }
      },
      {
        //Phân trang
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        //Join với users
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        //Join với stations (trạm bắt đầu)
        $lookup: {
          from: 'stations',
          localField: 'start_station',
          foreignField: '_id',
          as: 'start_station_info'
        }
      },
      {
        //Join với stations (trạm kết thúc)
        $lookup: {
          from: 'stations',
          localField: 'end_station',
          foreignField: '_id',
          as: 'end_station_info'
        }
      },
      {
        //$unwind user
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      {
        //$unwind trạm bắt đầu
        $unwind: { path: '$start_station_info', preserveNullAndEmptyArrays: true }
      },
      {
        //$unwind trạm kết thúc
        $unwind: { path: '$end_station_info', preserveNullAndEmptyArrays: true }
      },
      {
        //Định dạng lại output
        $project: {
          _id: 1,
          start_time: 1,
          end_time: 1,
          duration: 1,
          total_price: 1,
          user: {
            _id: '$user._id',
            fullname: '$user.fullname'
          },
          start_station: {
            _id: '$start_station_info._id',
            name: '$start_station_info.name'
          },
          end_station: {
            _id: '$end_station_info._id',
            name: '$end_station_info.name'
          }
        }
      }
    ]

    //Pipeline để đếm tổng số (cho phân trang)
    const countPipeline = [
      {
        $match: {
          bike_id: objBikeId,
          status: RentalStatus.Completed
        }
      },
      { $count: 'total_records' }
    ]

    const [rentals, countResult] = await Promise.all([
      databaseService.rentals.aggregate(pipeline).toArray(),
      databaseService.rentals.aggregate(countPipeline).toArray()
    ])

    const total_records = countResult[0]?.total_records || 0
    const total_pages = Math.ceil(total_records / limit)

    return {
      data: rentals,
      pagination: {
        page,
        limit,
        total_pages,
        total_records
      }
    }
  }
}

const bikesService = new BikesService();
export default bikesService;
