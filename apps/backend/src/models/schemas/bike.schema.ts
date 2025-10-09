import { ObjectId } from "mongodb";
import { BikeStatus } from "~/constants/enums";

type BikeType = {
  _id?: ObjectId;
  station_id: ObjectId;
  qr_code: string;
  status: BikeStatus;
  created_at?: Date;
  updated_at?: Date;
};

export default class Bike {
  _id?: ObjectId;
  station_id: ObjectId;
  qr_code: string;
  status: BikeStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor(bike: BikeType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = bike._id || new ObjectId();
    this.station_id = bike.station_id;
    this.qr_code = bike.qr_code;
    this.status = bike.status ?? BikeStatus.Available;
    this.created_at = bike.created_at || localTime;
    this.updated_at = bike.updated_at || localTime;
  }
}
