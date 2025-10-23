import { ObjectId } from "mongodb";

type StationType = {
  _id?: ObjectId;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
  created_at?: Date;
  updated_at?: Date;
  location_geo?: {
    type: "Point";
    coordinates: [number, number];//longitude, latitude
  };
};

export default class Station {
  _id?: ObjectId;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
  created_at?: Date;
  updated_at?: Date;
  location_geo?: {
    type: "Point";
    coordinates: [number, number];//longitude, latitude
  };

  constructor(station: StationType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = station._id || new ObjectId();
    this.name = station.name;
    this.address = station.address;
    this.latitude = station.latitude;
    this.longitude = station.longitude;
    this.capacity = station.capacity;
    this.created_at = station.created_at || localTime;
    this.updated_at = station.updated_at || localTime;
    const lng = parseFloat(station.longitude);
    const lat = parseFloat(station.latitude);
    if (!isNaN(lng) && !isNaN(lat)) {
      this.location_geo = {
        type: "Point",
        coordinates: [lng, lat],//longitude, latitude
      };
    }
  }
}
