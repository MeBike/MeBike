import type { BikeSwapStatus } from "generated/kysely/types";
import type {
  BikeStatus,
  ConfirmationMethod,
  HandoverStatus,
  RentalStatus,
  ReturnSlotStatus,
  UserRole,
  UserVerifyStatus,
} from "generated/prisma/enums";

export type RentalRow = {
  id: string;
  userId: string;
  reservationId: string | null;
  bikeId: string | null;
  depositHoldId: string | null;
  pricingPolicyId: string | null;
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

export type StaffBikeSwapRequestFilter = {
  userId?: string;
  status?: BikeSwapStatus;
  stationId?: string;
};

export type StaffBikeSwapRequestSortField
  = | "status"
    | "updatedAt"
    | "createdAt";

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
    totalCapacity: number;
    updatedAt: Date;
  };
  endStation: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    totalCapacity: number;
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
  };
  dailyRevenue: RevenueDelta;
  monthlyRevenue: RevenueDelta;
};

export type ReturnSlotRow = {
  id: string;
  rentalId: string;
  userId: string;
  stationId: string;
  reservedFrom: Date;
  status: ReturnSlotStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ReturnSlotStationCapacityRow = {
  stationId: string;
  totalCapacity: number;
  returnSlotLimit: number;
  totalBikes: number;
  activeReturnSlots: number;
};

export type ReturnConfirmationRow = {
  id: string;
  rentalId: string;
  stationId: string | null;
  agencyId: string | null;
  confirmedByUserId: string;
  confirmationMethod: ConfirmationMethod;
  handoverStatus: HandoverStatus;
  confirmedAt: Date;
  createdAt: Date;
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

export type BikeSwapRequestRow = {
  id: string;
  rentalId: string;
  userId: string;
  oldBikeId: string;
  newBikeId: string | null;
  stationId: string;
  reason: string;
  status: BikeSwapStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type StaffBikeSwapRequestRow = {
  id: string;
  rentalId: string;
  user: {
    id: string;
    fullName: string;
  };
  oldBike: {
    id: string;
    chipId: string;
    station: {
      id: string;
      name: string;
      address: string;
    };
    supplier: {
      id: string;
      name: string;
    };
  };
  newBike: {
    id: string;
    chipId: string;
    station: {
      id: string;
      name: string;
      address: string;
    };
    supplier: {
      id: string;
      name: string;
    };
  } | null;
  station: {
    id: string;
    name: string;
    address: string;
  } | null;
  reason: string;
  status: BikeSwapStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminBikeSwapRequestFilter = {
  userId?: string;
  status?: BikeSwapStatus;
  stationId?: string;
};
