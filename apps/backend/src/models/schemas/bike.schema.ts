import { ObjectId } from "mongodb";

import { BikeStatus } from "~/constants/enums";

type BikeType = {
  _id?: ObjectId;
  chip_id: string;
  station_id?: ObjectId | null; // null when bike is rented
  status: BikeStatus;
  supplier_id?: ObjectId | null; // null when bike is not under maintenance
  created_at?: Date;
  updated_at?: Date;
};

export default class Bike {
  _id?: ObjectId;
  chip_id: string;
  station_id?: ObjectId | null;
  status: BikeStatus;
  supplier_id?: ObjectId | null;
  created_at?: Date;
  updated_at?: Date;

  constructor(bike: BikeType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = bike._id || new ObjectId();
    this.chip_id = bike.chip_id;
    this.station_id = bike.station_id;
    this.status = bike.status || BikeStatus.Available;
    this.supplier_id = bike.supplier_id || null;
    this.created_at = bike.created_at || localTime;
    this.updated_at = bike.updated_at || localTime;
  }
}
