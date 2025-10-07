import { Decimal128, Int32, ObjectId } from "mongodb";

import { RentalStatus } from "~/constants/enums";

type RentalType = {
  _id?: ObjectId;
  user_id: ObjectId;
  bike_id: ObjectId;
  start_station: ObjectId;
  end_station?: ObjectId;
  start_time: Date;
  end_time?: Date;
  duration?: Int32;
  total_price?: Decimal128;
  status: RentalStatus;
  created_at?: Date;
  updated_at?: Date;
};

export default class Rental {
  _id?: ObjectId;
  user_id: ObjectId;
  bike_id: ObjectId;
  start_station: ObjectId;
  end_station?: ObjectId;
  start_time: Date;
  end_time?: Date;
  duration: Int32;
  total_price: Decimal128;
  status: RentalStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor(rental: RentalType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = rental._id || new ObjectId();
    this.user_id = rental.user_id;
    this.bike_id = rental.bike_id;
    this.start_station = rental.start_station;
    this.end_station = rental.end_station ?? undefined;
    this.start_time = rental.start_time ?? localTime;
    this.end_time = rental.end_time ?? undefined;
    this.duration = rental.duration instanceof Int32 ? rental.duration : new Int32(rental.duration ?? 0);
    this.total_price = rental.total_price instanceof Decimal128 ? rental.total_price : Decimal128.fromString(String(rental.total_price ?? 0));
    this.status = rental.status ?? RentalStatus.Rented;
    this.created_at = rental.created_at || localTime;
    this.updated_at = rental.updated_at || localTime;
  }
}
