import type { BikeStatus } from "generated/prisma/enums";

export type BikeRow = {
  id: string;
  chipId: string;
  stationId: string | null;
  supplierId: string | null;
  status: BikeStatus;
};
export type BikeFilter = {
  stationId?: string;
  id?: string;
  supplierId?: string;
  status?: BikeStatus;
};
export type BikeSortField = "status" | "name";

export type BikeRentalHistoryItem = {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  totalPrice: number | null;
  user: {
    id: string;
    fullname: string;
  };
  startStation: {
    id: string;
    name: string;
  };
  endStation?: {
    id: string;
    name: string;
  };
};

export type BikeRentalHistorySortField
  = | "endTime"
    | "startTime"
    | "totalPrice"
    | "duration";

export type BikeActivityStats = {
  bikeId: string;
  totalMinutesActive: number;
  totalReports: number;
  uptimePercentage: number;
  monthlyStats: BikeActivityStatsMonthlyRow[];
};

export type BikeActivityStatsMonthlyRow = {
  year: number;
  month: number;
  rentalsCount: number;
  minutesActive: number;
  revenue: number;
};

export type BikeActivityStatsRaw = {
  totalMinutesActive: number;
  totalRevenue: number;
  minStartTime: Date | null;
  monthly: BikeActivityStatsMonthlyRow[];
};

export type BikeRentalStats = {
  totalActiveBikes: number;
  rentedBikes: number;
  percentage: number;
};

export type HighestRevenueBike = {
  bikeId: string;
  bikeChipId: string;
  totalRevenue: number;
  rentalCount: number;
  station: {
    id: string;
    name: string;
  } | null;
};
