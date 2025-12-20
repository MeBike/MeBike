export type StationStatus = "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG";

export interface LocationGeo {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Station {
  id: string;
  name: string;
  longitude: string;
  latitude: string;
  address: string;
  capacity: number;
  distance: number | null;
  createdAt: string;
  updatedAt: string;
};
interface StationBikeRevenue {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalStations: number;
    totalRevenue: number;
    totalRevenueFormatted: string;
    totalRentals: number;
  };
  stations: StationWithBikes[];
}
export interface StationWithBikes {
  _id: string;
  name: string;
  address: string;
  stationTotalRevenue: number;
  stationTotalRevenueFormatted: string;
  stationTotalRentals: number;
  bikes: BikeStatistic[];
}
export interface BikeStatistic {
  _id: string;
  chip_id: string;
  totalRevenue: number;
  totalRevenueFormatted: string;
  totalRentals: number;
  totalDuration: number;
}
export interface StationStatisticsResponse {
  period: {
    from: string; // ISO datetime string
    to: string; // ISO datetime string
  };
  summary: {
    totalStations: number;
    totalRevenue: number;
    totalRevenueFormatted: string;
    totalRentals: number;
    avgRevenuePerStation: number;
    avgRevenuePerStationFormatted: string;
  };
  stations: StationStatistic[];
}

export interface StationStatistic {
  _id: string;
  name: string;
  address: string;
  totalRentals: number;
  totalRevenue: number;
  totalRevenueFormatted: string;
  totalDuration: number;
  totalDurationFormatted: string;
  avgDuration: number;
  avgDurationFormatted: string;
}
export interface NearestStationResponse {
  distance_meters: number;
  bike_id: string;
  chip_id: string;
  status: string;
  station_id: string;
  station_name: string;
  station_address: string;
  distance_km: number;
}