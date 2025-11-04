export type StationStatus = "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG";

export interface LocationGeo {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Station {
  _id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
  created_at: string;
  updated_at: string;
  location_geo: LocationGeo;
  description?: string;
  type?: string;
  stationNumber?: string;
  bikeStation?: {
    id: string;
    stationId: number;
    totalBikes: number;
    availableBikes: number;
    location: {
      lat: number;
      lng: number;
    };
    distance: number;
  };
}
