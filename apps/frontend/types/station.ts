export interface Station {
  name: string;
  description: string;
  address: string;
  type: string;
  stationNumber: string;
  bikeStation: BikeStation;
}
export interface BikeStation {
  id: string;
  stationId: number;
  totalBikes: number;
  availableBikes: number;
  location: {
    lat: number;
    lng: number;
  };
  distance: number; // meters from metro station
}
export interface RentalSession {
  id: string;
  bikeId: string;
  startTime: Date;
  stationName: string;
  userId: string;
}
