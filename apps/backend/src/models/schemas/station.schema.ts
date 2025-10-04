import { ObjectId } from "mongodb";

type StationType = {
  _id?: ObjectId;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  created_at?: Date;
  updated_at?: Date;
};

export default class Station {
  _id?: ObjectId;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  created_at?: Date;
  updated_at?: Date;

  constructor(station: StationType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = station._id || new ObjectId();
    this.name = station.name;
    this.address = station.address;
    this.latitude = station.latitude;
    this.longitude = station.latitude;
    this.created_at = station.created_at || localTime;
    this.updated_at = station.updated_at || localTime;
  }
}
