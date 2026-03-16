import type {
  BikeStatus,
  RentalStatus,
  UserRole,
  UserVerifyStatus,
} from "generated/prisma/enums";

export type RentalRow = {
  id: string;
  userId: string;
  bikeId: string | null;
  startStationId: string;
  endStationId: string | null;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  totalPrice: number | null;
  subscriptionId: string | null;
  status: RentalStatus;
  updatedAt: Date;
};

export type RentalFilter = {
  status?: RentalStatus;
  startStationId?: string;
  endStationId?: string;
};

export type RentalSortField = "startTime" | "endTime" | "status" | "updatedAt";

export type MyRentalFilter = RentalFilter;

export type AdminRentalFilter = {
  userId?: string;
  bikeId?: string;
  startStationId?: string;
  endStationId?: string;
  status?: RentalStatus;
};

export type AdminRentalListItem = {
  id: string;
  user: {
    id: string;
    fullname: string;
  };
  bikeId: string | null;
  status: RentalStatus;
  startStationId: string;
  endStationId: string | null;
  createdAt: Date;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  totalPrice: number | null;
  subscriptionId: string | null;
  updatedAt: Date;
};

export type AdminRentalDetail = {
  id: string;
  user: {
    id: string;
    fullname: string;
    email: string;
    verify: UserVerifyStatus;
    location: string;
    username: string;
    phoneNumber: string;
    avatar: string;
    role: UserRole;
    nfcCardUid: string | null;
    updatedAt: Date;
  };
  bike: {
    id: string;
    chipId: string;
    status: BikeStatus;
    supplierId: string | null;
    updatedAt: Date;
  } | null;
  startStation: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    capacity: number;
    updatedAt: Date;
  };
  endStation: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    capacity: number;
    updatedAt: Date;
  } | null;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  totalPrice: number | null;
  subscriptionId: string | null;
  status: RentalStatus;
  updatedAt: Date;
};

export type RentalCountsRow = {
  status: RentalStatus;
  count: number;
};

export type RentalStatusCounts = {
  RENTED: number;
  COMPLETED: number;
  CANCELLED: number;
  RESERVED: number;
};

export type RentalRevenueGroupBy = "DAY" | "MONTH" | "YEAR";

export type RentalRevenuePoint = {
  date: Date;
  totalRevenue: number;
  totalRentals: number;
};

export type RentalRevenueStats = {
  period: {
    from: Date;
    to: Date;
  };
  groupBy: RentalRevenueGroupBy;
  data: readonly RentalRevenuePoint[];
};

export type RevenueDelta = {
  current: number;
  previous: number;
  difference: number;
  percentChange: number;
};

export type RentalSummaryStats = {
  rentalList: {
    Rented: number;
    Completed: number;
    Cancelled: number;
    Reserved: number;
  };
  dailyRevenue: RevenueDelta;
  monthlyRevenue: RevenueDelta;
};

export type DashboardTrend = "UP" | "DOWN" | "STABLE";

export type DashboardRevenueSnapshot = {
  totalRevenue: number;
  totalRentals: number;
};

export type HourlyRentalStat = {
  hour: number;
  totalRentals: number;
};

export type RentalDashboardSummary = {
  revenueSummary: {
    today: DashboardRevenueSnapshot;
    yesterday: DashboardRevenueSnapshot;
    revenueChange: number;
    revenueTrend: DashboardTrend;
    rentalChange: number;
    rentalTrend: DashboardTrend;
  };
  hourlyRentalStats: HourlyRentalStat[];
};
