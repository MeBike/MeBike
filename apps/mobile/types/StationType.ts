export type StationType = {
  _id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
  created_at: string;
  updated_at: string;
  totalBikes: number;
  availableBikes: number;
  bookedBikes: number;
  brokenBikes: number;
  reservedBikes: number;
  maintainedBikes: number;
  emptySlots: number;
  average_rating?: number;
  total_ratings?: number;
};
export type StationLocation = {
  type: "Point";
  coordinates: [number, number];
};

export type Station = {
  _id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
  created_at: string;
  updated_at: string;
  location_geo: StationLocation;
  distance_meters: number;
  totalBikes: number;
  emptySlots: number;
  availableBikes: number;
  bookedBikes: number;
  brokenBikes: number;
  reservedBikes: number;
  maintainedBikes: number;
  unavailableBikes: number;
  average_rating?: number;
  total_ratings?: number;
};
