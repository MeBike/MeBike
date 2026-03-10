
export interface Bike {
  id: string;
  chipId: string;
  stationId: string;
  status: BikeStatus;
  supplierId: string | null;
  createdAt: string;
  updatedAt: string;
  chipId: string;
  averageRating?: number;
  totalRatings?: number;
}
export type BikeStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "BROKEN"
  | "RESERVED"
  | "MAINTENANCE"
  | "UNAVAILABLE"
  | "";
export interface BikeActivityStats {
  bikeId: string;
  totalMinutesActive: number;
  totalReports: number;
  uptimePercentage: number;
  monthlyStats: Array<{
    year: number;
    month: number;
    rentalsCount: number;
    minutesActive: number;
    revenue: number;
  }>;
}
export interface BikeStats {
  id: string;
  totalRentals: number;
  totalRevenue: number;
  totalDurationMinutes: number;
  totalReports: number;
}
export interface BikeRentalHistory {
  id: string;
  startStation: {
    id: string;
    name: string;
  };
  endStation: {
    id: string;
    name: string;
  };
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  user: {
    id: string;
    fullname: string;
  };
}
export interface BikeHasHighestRevenue {
  bikdId: string;
  bikeChipId: string;
  totalRevenue: number;
  rentalCount: number;
  station : {
    id : string;
    name : string;
  }
}
export interface BikeStatistics {
  "RESERVED": number;
  "AVAILABLE": number;
  "RENTED": number;
  "UNAVAILABLE": number;
  "BROKEN": number;
}
export interface BikeActionProps {
  hasToken: boolean,
  bike_detail_id?: string,
  stationId?: string,
  supplierId?: string,
  status?: BikeStatus,
  pageSize?: number,
  page?: number,
}