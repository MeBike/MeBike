import type { ObjectId } from "mongodb";

import { Decimal128, Int32 } from "mongodb";

import { BikeStatus, RentalStatus } from "~/constants/enums";
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
          status: RentalStatus.Ongoing,
        });

        await databaseService.rentals.insertOne(rental, { session });

        await databaseService.bikes.updateOne(
          { _id: objectedBikeId },
          { $set: { status: BikeStatus.InUse } },
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
