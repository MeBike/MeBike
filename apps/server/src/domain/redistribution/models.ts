import type {
  BikeStatus,
  RedistributionStatus,
  UserRole,
  UserVerifyStatus,
} from "generated/prisma/enums";

export type UserSummary = {
  id: string;
  fullName: string;
};

export type UserDetail = {
  id: string;
  fullName: string;
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

export type StationSummary = {
  id: string;
  name: string;
};

export type StationDetail = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalCapacity: number;
  updatedAt: Date;
};

export type BikeDetail = {
  id: string;
  bikeNumber: string;
  status: BikeStatus;
  supplierId: string | null;
  updatedAt: Date;
};

export type RedistributionRequestItem = {
  id: string;
  redistributionRequestId: string;
  bikeId: string;
  deliveredAt: Date | null;
  createdAt: Date;
};

export type RedistributionRequestItemDetail = {
  id: string;
  redistributionRequestId: string;
  bike: BikeDetail;
  deliveredAt: Date | null;
  createdAt: Date;
};

export type RedistributionRequestRow = {
  id: string;
  requestedByUserId: string;
  approvedByUserId: string | null;
  sourceStationId: string;
  targetStationId: string;
  requestedQuantity: number;
  reason: string | null;
  items: RedistributionRequestItem[];
  status: RedistributionStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RedistributionRequestSummaryRow = {
  id: string;
  requestedByUser: UserSummary;
  approvedByUser: UserSummary | null;
  sourceStation: StationSummary;
  targetStation: StationSummary;
  requestedQuantity: number;
  reason: string | null;
  items: RedistributionRequestItem[];
  status: RedistributionStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RedistributionRequestDetailRow = {
  id: string;
  requestedByUser: UserDetail;
  approvedByUser: UserDetail | null;
  sourceStation: StationDetail;
  targetStation: StationDetail;
  requestedQuantity: number;
  reason: string | null;
  items: RedistributionRequestItemDetail[];
  status: RedistributionStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RedistributionFilter = {
  status?: RedistributionStatus;
  statuses?: RedistributionStatus[];
  targetStationId?: string;
  from?: Date;
  to?: Date;
};

export type RedistributionSortField = "createdAt" | "startedAt" | "completedAt";

export type MyInStationRedistributionFilter = RedistributionFilter;

export type InStationRedistributionFilter = {
  requestedByUserId?: string;
  approvedByUserId?: string;
  sourceStationId?: string;
} & RedistributionFilter;

export type AdminRedistributionFilter = {
  requestedByUserId?: string;
  approvedByUserId?: string;
  sourceStationId?: string;
  OR?: AdminRedistributionFilter[];
} & RedistributionFilter;
