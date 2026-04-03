import type {
  BikeStatus,
  Prisma as PrismaTypes,
  ReservationOption,
  ReservationStatus,
  UserRole,
} from "generated/prisma/client";

export type ReservationDecimal = PrismaTypes.Decimal;

export type ReservationRow = {
  readonly id: string;
  readonly userId: string;
  readonly bikeId: string | null;
  readonly stationId: string;
  readonly pricingPolicyId: string | null;
  readonly reservationOption: ReservationOption;
  readonly fixedSlotTemplateId: string | null;
  readonly subscriptionId: string | null;
  readonly startTime: Date;
  readonly endTime: Date | null;
  readonly prepaid: ReservationDecimal;
  readonly status: ReservationStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ReservationDetailUserRow = {
  readonly id: string;
  readonly fullName: string;
  readonly username: string | null;
  readonly email: string;
  readonly phoneNumber: string | null;
  readonly avatar: string | null;
  readonly role: UserRole;
};

export type ReservationDetailBikeRow = {
  readonly id: string;
  readonly chipId: string;
  readonly status: BikeStatus;
};

export type ReservationDetailStationRow = {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly latitude: number;
  readonly longitude: number;
};

export type ReservationExpandedDetailRow = ReservationRow & {
  readonly user: ReservationDetailUserRow;
  readonly bike: ReservationDetailBikeRow | null;
  readonly station: ReservationDetailStationRow;
};

export type ReservationSortField = "startTime" | "endTime" | "status" | "updatedAt";

export type AdminReservationSortField
  = | ReservationSortField
    | "createdAt";

export type ReservationFilter = {
  readonly status?: ReservationStatus;
  readonly stationId?: string;
  readonly reservationOption?: ReservationOption;
};

export type AdminReservationFilter = ReservationFilter & {
  readonly userId?: string;
  readonly bikeId?: string;
};

export type ReservationCountsRow = {
  status: ReservationStatus;
  count: number;
};

export type ReservationStatusCounts = {
  PENDING: number;
  FULFILLED: number;
  CANCELLED: number;
  EXPIRED: number;
};

export type ReservationSummaryStats = {
  reservationList: {
    Pending: number;
    Fulfilled: number;
    Cancelled: number;
    Expired: number;
  };
};
