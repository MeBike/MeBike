import type { Decimal128, Int32 } from "mongodb";

import { ObjectId } from "mongodb";

import type { RentalStatus } from "~/constants/enums";

export type RentalType = {
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
  duration?: Int32;
  total_price?: Decimal128;
  status: RentalStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor(rent: RentalType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = rent._id || new ObjectId();
    this.user_id = rent.user_id;
    this.bike_id = rent.bike_id;
    this.start_station = rent.start_station;
    this.end_station = rent.end_station;
    this.start_time = rent.start_time;
    this.end_time = rent.end_time;
    this.duration = rent.duration;
    this.total_price = rent.total_price;
    this.status = rent.status;
    this.created_at = rent.created_at || localTime;
    this.updated_at = rent.updated_at || localTime;
  }
}
