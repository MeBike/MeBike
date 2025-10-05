import type { ObjectId } from "mongodb";

import { Decimal128, Int32 } from "mongodb";

import { BikeStatus, RentalStatus } from "~/constants/enums";
import { COMMON_MESSAGE } from "~/constants/messages";
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
