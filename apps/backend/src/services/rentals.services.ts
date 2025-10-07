import type { ObjectId } from "mongodb";

import { Decimal128, Int32 } from "mongodb";

import { BikeStatus, GroupByOptions, RentalStatus, ReservationStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { AUTH_MESSAGE, COMMON_MESSAGE, RENTALS_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import Rental from "~/models/schemas/rental.schema";
import { toObjectId } from "~/utils/string";

import databaseService from "./database.services";

class RentalsService {
  async createRentalSession({
    user_id,
    start_station,
    bike_id,
  }: {
    user_id: ObjectId | string;
    start_station: ObjectId | string;
    bike_id: ObjectId | string;
  }) {
    const objectedBikeId = toObjectId(bike_id);
    const session = databaseService.getClient().startSession();

    try {
      let rental: Rental | null = null;
      await session.withTransaction(async () => {
        rental = new Rental({
          user_id: toObjectId(user_id),
          start_station: toObjectId(start_station),
          bike_id: objectedBikeId,
          start_time: new Date(),
          status: RentalStatus.Rented,
        });

        await databaseService.rentals.insertOne(rental, { session });

        await databaseService.bikes.updateOne(
          { _id: objectedBikeId },
          { $set: { status: BikeStatus.Booked } },
          { session },
        );
      });
      return rental;
    }
    catch (error) {
      console.error(COMMON_MESSAGE.CREATE_SESSION_FAIL, error);
    }
    finally {
      await session.endSession();
    }
  }

  async endRentalSession({
    user_id,
    rental,
    end_station,
  }: {
    user_id: ObjectId;
    rental: Rental;
    end_station: string | ObjectId;
  }) {
    const objectedEndStationId = toObjectId(end_station);
    const session = databaseService.getClient().startSession();
    try {
      let endedRental: Rental = rental;
      await session.withTransaction(async () => {
        const endTime = new Date();
        const duration = this.generateDuration(rental.start_time, endTime);
        const totalPrice = this.generateTotalPrice(duration);

        const updatedData: Partial<Rental> = {
          end_station: objectedEndStationId,
          end_time: endTime,
          duration: new Int32(duration),
          total_price: Decimal128.fromString(totalPrice.toString()),
        };

        const result = await databaseService.rentals.findOneAndUpdate(
          { _id: rental._id },
          { $set: updatedData },
          { returnDocument: "after", session },
        );

        if (result) {
          endedRental = result;
          await databaseService.bikes.updateOne(
            { _id: result.bike_id },
            { $set: {
              station_id: objectedEndStationId,
              status: BikeStatus.Available,
            } },
            { session },
          );
        }
      });
      return endedRental;
    }
    catch (error) {
      console.error(COMMON_MESSAGE.CREATE_SESSION_FAIL, error);
    }
    finally {
      await session.endSession();
    }
  }

  // for staff/admin
  async getDetailRental({ rental_id }: { rental_id: string | ObjectId }) {
    const rental = await databaseService.rentals.findOne({
      _id: toObjectId(rental_id),
    });
    if (!rental) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.NOT_FOUND.replace("%s", rental_id.toString()),
        status: HTTP_STATUS.NOT_FOUND,
      });
    }
    await this.buildDetailResponse(rental);
  }

  // for user
  async getMyDetailRental({
    user_id,
    rental_id,
  }: {
    user_id: ObjectId;
    rental_id: string | ObjectId;
  }) {
    const rental = await databaseService.rentals.findOne({
      _id: toObjectId(rental_id),
    });
    if (!rental) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.NOT_FOUND.replace("%s", rental_id.toString()),
        status: HTTP_STATUS.NOT_FOUND,
      });
    }
    if (!rental.user_id.toString().localeCompare(user_id.toString())) {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGE.ACCESS_DENIED,
        status: HTTP_STATUS.FORBIDDEN,
      });
    }
    await this.buildDetailResponse(rental);
  }

  async buildDetailResponse(rental: Rental) {
    const user = await databaseService.users.findOne({ _id: rental.user_id });
    if (!user) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.USER_NOT_FOUND.replace("%s", rental.user_id.toString()),
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const bike = await databaseService.bikes.findOne({ _id: rental.bike_id });
    if (!bike) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.BIKE_NOT_FOUND.replace("%s", rental.bike_id.toString()),
        status: HTTP_STATUS.NOT_FOUND,
      });
    }
    const bikeStation = await databaseService.stations.findOne({ _id: bike.station_id });
    if (!bikeStation) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace("%s", rental.start_station.toString()),
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const startStation = await databaseService.stations.findOne({ _id: rental.start_station });
    if (!startStation) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace("%s", rental.start_station.toString()),
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    let endStation = null;
    if (rental.end_station) {
      endStation = await databaseService.stations.findOne({ _id: rental.end_station });
    }

    const { password, email_verify_token, forgot_password_token, ...insensitiveUserData } = user;
    const { station_id, ...restBike } = bike;
    const { _id, user_id, bike_id, start_station, end_station, ...restRental } = rental;

    return {
      _id,
      user: insensitiveUserData,
      bike: restBike,
      start_station: startStation,
      end_station: endStation,
      ...restRental,
    };
  }

  async getRentalRevenue({
    from,
    to,
    groupBy,
  }: {
    from: Date;
    to: Date;
    groupBy: GroupByOptions;
  }) {
    let dateFormat;
    switch (groupBy) {
      case GroupByOptions.Month:
        dateFormat = "%m-%Y";
        break;
      case GroupByOptions.Year:
        dateFormat = "%Y";
        break;
      default:
        dateFormat = "%d-%m-%Y";
    }

    const startDate = from ? new Date(from) : new Date("01-01-2025");
    const endDate = to ? new Date(to) : new Date();

    const pipeline = [
      {
        $match: {
          status: RentalStatus.Completed,
          end_time: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: "$end_time" } },
          },
          totalRevenue: { $sum: { $toDouble: "$total_price" } },
          totalRentals: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id.period",
          totalRevenue: 1,
          totalRentals: 1,
        },
      },
    ];

    const result = await databaseService.rentals.aggregate(pipeline).toArray();
    return {
      period: { from: startDate, to: endDate },
      groupBy: groupBy ?? GroupByOptions.Day,
      data: result,
    };
  }

  async getBikeUsages({
    from,
    to,
    stationId,
  }: {
    from: Date;
    to: Date;
    stationId: string;
  }) {
    const startDate = from ? new Date(from) : new Date("01-01-2025");
    const endDate = to ? new Date(to) : new Date();

    const matchStage: any = {
      start_time: { $gte: startDate },
      end_time: { $lte: endDate },
      status: RentalStatus.Completed,
    };

    if (stationId) {
      matchStage.start_station = toObjectId(stationId);
    }

    const pipeline = [
      {
        $match: matchStage,
      },
      {
        $addFields: {
          duration_hours: {
            $divide: [
              { $subtract: ["$end_time", "$start_time"] },
              1000 * 60 * 60,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$start_station",
          totalUsageHours: { $sum: "$duration_hours" },
          totalRentals: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "stations",
          localField: "_id",
          foreignField: "_id",
          as: "station",
        },
      },
      { $unwind: "$station" },
      {
        $lookup: {
          from: "bikes",
          let: { stationId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$current_station_id", "$$stationId"] } } },
            { $count: "total_bikes" },
          ],
          as: "bike_stats",
        },
      },
      {
        $addFields: {
          totalBikes: { $ifNull: [{ $arrayElemAt: ["$bike_stats.total_bikes", 0] }, 0] },
        },
      },
      {
        $addFields: {
          totalAvailableHours: {
            $multiply: [
              "$totalBikes",
              {
                $divide: [
                  { $subtract: [endDate, startDate] },
                  1000 * 60 * 60,
                ],
              },
            ],
          },
          usageRate: {
            $cond: [
              { $eq: ["$totalAvailableHours", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalUsageHours", "$totalAvailableHours"] },
                  100,
                ],
              },
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.period",
          totalRentals: 1,
          totalUsageHours: 1,
          totalAvailableHours: 1,
          usageRate: { $round: ["$usageRate", 2] },
        },
      },
      { $sort: { date: 1 } },
    ];

    const result = await databaseService.rentals.aggregate(pipeline).toArray();
    return {
      period: { from: startDate, to: endDate },
      data: result,
    };
  }

  async getReservationsStatistic({
    from,
    to,
    groupBy,
  }: {
    from: Date;
    to: Date;
    groupBy: GroupByOptions;
  }) {
    const startDate = from ? new Date(from) : new Date("01-01-2025");
    const endDate = to ? new Date(to) : new Date();

    let dateFormat;
    switch (groupBy) {
      case GroupByOptions.Month:
        dateFormat = "%m-%Y";
        break;
      case GroupByOptions.Year:
        dateFormat = "%Y";
        break;
      default:
        dateFormat = "%d-%m-%Y";
    }

    const pipeline = [
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: "$start_time" } },
          },
          totalReservations: { $sum: 1 },
          successful: {
            $sum: {
              $cond: [{ $eq: ["$status", ReservationStatus.Active] }, 1, 0],
            },
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ["$status", ReservationStatus.Cancelled] }, 1, 0],
            },
          },
          expired: {
            $sum: {
              $cond: [{ $eq: ["$status", ReservationStatus.Expired] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          period: "$_id.period",
          totalReservations: 1,
          successful: 1,
          cancelled: 1,
          expired: 1,
          successRate: {
            $cond: [
              { $gt: ["$totalReservations", 0] },
              { $divide: ["$successful", "$totalReservations"] },
              0,
            ],
          },
        },
      },
      { $sort: { period: -1 } },
    ];

    const result = await databaseService.reservations.aggregate(pipeline).toArray();
    return {
      period: { from: startDate, to: endDate },
      groupBy: groupBy ?? GroupByOptions.Day,
      data: result,
    };
  }

  async getStationTraffic() {

  }

  generateDuration(start: Date, end: Date) {
    return Math.ceil((end.getTime() - start.getTime()) / 60000);
  }

  generateTotalPrice(duration: number) {
    // eslint-disable-next-line node/prefer-global/process
    const pricePerMin = Number(process.env.PRICE_PER_MIN || "1");
    return pricePerMin * duration;
  }
}

const rentalsService = new RentalsService();
export default rentalsService;
