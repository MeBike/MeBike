import { Decimal128, ObjectId } from "mongodb";

import { ReservationStatus } from "~/constants/enums";
import { getLocalTime } from "~/utils/date";

type ReservationType = {
  _id?: ObjectId;
  user_id: ObjectId;
  bike_id: ObjectId;
  station_id: ObjectId;
  start_time: Date;
  end_time: Date;
  prepaid: Decimal128;
  status: ReservationStatus;
  created_at?: Date;
  updated_at?: Date;
};

export default class Reservation {
  _id?: ObjectId;
  user_id: ObjectId;
  bike_id: ObjectId;
  station_id: ObjectId;
  start_time: Date;
  end_time: Date;
  prepaid: Decimal128;
  status: ReservationStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor(reservation: ReservationType) {
    const localTime = getLocalTime()

    this._id = reservation._id || new ObjectId();
    this.user_id = reservation.user_id;
    this.bike_id = reservation.bike_id;
    this.station_id = reservation.station_id;
    this.start_time = reservation.start_time ?? localTime;
    this.end_time = reservation.end_time
      ?? new Date((reservation.start_time ?? localTime).getTime() + 60 * 60 * 1000);
    this.prepaid = reservation.prepaid instanceof Decimal128 ? reservation.prepaid : Decimal128.fromString(String(reservation.prepaid ?? 0));
    this.status = reservation.status ?? ReservationStatus.Pending;
    this.created_at = reservation.created_at || localTime;
    this.updated_at = reservation.updated_at || localTime;
  }
}
