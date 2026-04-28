export type StationStatus = "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG";

export interface LocationGeo {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}
export interface Worker {
  userId : string;
  fullName : string;
  role : string;
  technicianTeamId : string | null;
  technicianTeamName : string | null;
}
export interface Station {
  id: string;
  name: string;
  address: string;
  location : {
    latitude : number;
    longitude : number;
  }
  stationType: "INTERNAL" | "AGENCY";
  capacity: {
    total : number;
    returnSlotLimit : number;
    emptyPhysicalSlots : number;
  };
  bikes : {
    total: number,
    available: number,
    booked: number,
    broken: number,
    reserved: number,
    maintained: number,
    unavailable: number
  }
  workers : Worker[],
  createdAt: string;pickupSlotLimit
  updatedAt: string;
}
export interface StationStatistic {
  id: string; // API trả về "id" chứ không phải "_id"
  name: string;
  address: string;
  totalRevenue?: number; // Back-end thường trả về số
  stationTotalRevenue?: number; 
  totalRentals?: number;
  stationTotalRentals?: number;
  totalDurationFormatted?: string; // Nếu không có, mình sẽ fallback "--"
}

export interface StationBikeRevenue {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalStations: number;
    totalRevenue: number;
    totalRentals: number;
    avgRevenuePerStation: number;
  };
  stations: StationStatistic[];
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
export interface StationActionProps {
  hasToken?: boolean;
  stationId?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  name?: string;
  stationType ?: string;
  longitude?: number;
}
export interface SelectStation {
  id : string;
  name : string;
  stationId : string; 
}

export type currentStation = {
  id : string;
  name : string;
  address : string;
}
export interface CurrentStation {
  currentStation : currentStation,
  otherStations : currentStation[],
}

export type GroupBy = "DAY" | "WEEK" | "MONTH" | "YEAR";

export interface Period {
  from: string;
  to: string;
}

export interface Summary {
  totalStations: number;
  totalRevenue: number;
  totalRentals: number;
  avgRevenuePerStation: number;
}

export interface StationReport {
  id: string;
  name: string;
  address: string;
  totalRentals: number;
  totalRevenue: number;
  totalDuration: number;
  avgDuration: number;
}

export interface SeriesItem {
  date: string; // ISO string
  totalRevenue: number;
  totalRentals: number;
}

export interface StaffReportRevenueResponse {
  period: Period;
  summary: Summary;
  stations: StationReport[];
  groupBy: GroupBy;
  series: SeriesItem[];
}