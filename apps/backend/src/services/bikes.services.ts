import type { NextFunction, Response } from "express";

import { ObjectId } from "mongodb";

import type { CreateBikeReqBody, GetBikesReqQuery, UpdateBikeReqBody } from "~/models/requests/bikes.request";

import { BikeStatus, RentalStatus, ReservationStatus, ReportTypeEnum } from "~/constants/enums";
import Bike from "~/models/schemas/bike.schema";
import { sendPaginatedResponse } from "~/utils/pagination.helper";
import { getLocalTime } from "~/utils/date-time";

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
        filter.chip_id = { $regex: chip_id, $options: "i" };
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

  async getBikeActivityStats(bikeId: string) {
    const objBikeId = new ObjectId(bikeId)

    //Tính tổng số phút hoạt động (từ các rental đã hoàn thành)
    const totalMinutesPipeline = [
      {
        $match: {
          bike_id: objBikeId,
          status: RentalStatus.Completed
        }
      },
      {
        $group: {
          _id: null,
          total_duration_minutes: { $sum: "$duration" }
        }
      }
    ]

    const totalMinutesResult = await databaseService.rentals.aggregate(totalMinutesPipeline).toArray()
    const total_duration_minutes = totalMinutesResult[0]?.total_duration_minutes || 0

    //tính số lần báo hỏng (từ reports collection)
    const totalReports = await databaseService.reports.countDocuments({
      bike_id: objBikeId,
      type: { $in: [ReportTypeEnum.BikeDamage, ReportTypeEnum.BikeDirty] } // Chỉ đếm report về hỏng xe
    })

    //tính số lần bảo trì (từ maintenance logs nếu có, hoặc từ status changes)
    //Hiện tại chưa có maintenance_logs collection, tạm thời set = 0
    // const maintenanceCount = 0

    // Tính tỷ lệ uptime (thời gian available / tổng thời gian)
    // Hiện tại chưa có dữ liệu tracking thời gian available thực tế
    // Tạm thời tính dựa trên giả định xe có thể hoạt động 24/7
    const bike = await databaseService.bikes.findOne({ _id: objBikeId })
    const created_date = bike?.created_at
    const now = getLocalTime()

    let uptime_percentage = 0
    if (created_date) {
      const total_days = Math.ceil((now.getTime() - created_date.getTime()) / (1000 * 60 * 60 * 24))
      //xe có thể hoạt động 24 giờ/ngày = 1440 phút/ngày
      const estimated_available_minutes = total_days * 1440
      const actual_used_minutes = total_duration_minutes
      uptime_percentage = Math.min(100, (actual_used_minutes / estimated_available_minutes) * 100)
    }

    //Thống kê theo tháng (có thể dùng cho chart)
    const monthlyStatsPipeline = [
      {
        $match: {
          bike_id: objBikeId,
          status: RentalStatus.Completed
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$end_time" },
            month: { $month: "$end_time" }
          },
          rentals_count: { $sum: 1 },
          total_duration: { $sum: "$duration" },
          total_revenue: { $sum: { $toDouble: "$total_price" } }
        }
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 }
      },
      {
        $limit: 12 // 12 tháng gần nhất
      }
    ]

    const monthly_stats = await databaseService.rentals.aggregate(monthlyStatsPipeline).toArray()

    return {
      bike_id: bikeId,
      total_minutes_active: total_duration_minutes,
      total_reports: totalReports,
      // total_maintenance: maintenanceCount,
      uptime_percentage: Math.round(uptime_percentage * 100) / 100,
      monthly_stats: monthly_stats.map(stat => ({
        year: stat._id.year,
        month: stat._id.month,
        rentals_count: stat.rentals_count,
        minutes_active: stat.total_duration,
        revenue: stat.total_revenue
      }))
    }
  }

  async getBikeRentalStats() {
    //Sử dụng $facet để đếm song song
    const statsPipeline = [
      {
        $facet: {
          //Đếm tổng số xe đang hoạt động (không tính xe đã ngừng)
          "total_active_bikes": [
            {
              $match: {
                //BikeStatus.Unavailable là trạng thái soft-delete
                status: { $ne: BikeStatus.Unavailable }
              }
            },
            { $count: "count" }
          ],
          //Đếm số xe đang được thuê
          "rented_bikes": [
            { $match: { status: BikeStatus.Booked } },
            { $count: "count" }
          ]
        }
      },
      {
        // Định dạng lại output
        $project: {
          "total_active_bikes": { $ifNull: [{ $arrayElemAt: ["$total_active_bikes.count", 0] }, 0] },
          "rented_bikes": { $ifNull: [{ $arrayElemAt: ["$rented_bikes.count", 0] }, 0] }
        }
      }
    ]

    const result = await databaseService.bikes.aggregate(statsPipeline).toArray()
    const counts = result[0] || { total_active_bikes: 0, rented_bikes: 0 }

    const { total_active_bikes, rented_bikes } = counts
    let percentage: number = 0.0

    //Tính toán phần trăm (tránh chia cho 0)
    if (total_active_bikes > 0) {
      percentage = (rented_bikes / total_active_bikes) * 100
    }

    return {
      total_active_bikes: total_active_bikes,
      rented_bikes: rented_bikes,
      percentage: parseFloat(percentage.toFixed(2))
    }
  }

  async getHighestRevenueBike() {
    const pipeline = [
      {
        // Chỉ lấy rentals đã hoàn thành
        $match: {
          status: RentalStatus.Completed
        }
      },
      {
        // Group by bike_id để tính tổng doanh thu và số lượt thuê
        $group: {
          _id: "$bike_id",
          total_revenue: { $sum: { $toDouble: "$total_price" } },
          rental_count: { $sum: 1 }
        }
      },
      {
        // Sắp xếp theo doanh thu giảm dần
        $sort: { total_revenue: -1 }
      },
      {
        // Lấy xe có doanh thu cao nhất
        $limit: 1
      },
      {
        // Join với bikes collection để lấy thông tin xe
        $lookup: {
          from: 'bikes',
          localField: '_id',
          foreignField: '_id',
          as: 'bike_info'
        }
      },
      {
        // Join với stations collection để lấy thông tin trạm
        $lookup: {
          from: 'stations',
          localField: 'bike_info.station_id',
          foreignField: '_id',
          as: 'station_info'
        }
      },
      {
        // Unwind để dễ xử lý
        $unwind: { path: '$bike_info', preserveNullAndEmptyArrays: true }
      },
      {
        // Unwind station
        $unwind: { path: '$station_info', preserveNullAndEmptyArrays: true }
      },
      {
        // Định dạng output
        $project: {
          bike_id: '$_id',
          bike_chip_id: '$bike_info.chip_id',
          total_revenue: 1,
          rental_count: 1,
          station: {
            _id: '$station_info._id',
            name: '$station_info.name'
          }
        }
      }
    ]

    const result = await databaseService.rentals.aggregate(pipeline).toArray()

    if (result.length === 0) {
      return null
    }

    return result[0]
  }
}

const bikesService = new BikesService();
export default bikesService;
