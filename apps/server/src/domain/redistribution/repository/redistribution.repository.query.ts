import type { PageRequest } from "@/domain/shared/pagination";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type {
  RedistributionRequestDetailRow,
  RedistributionRequestRow,
  RedistributionRequestSummaryRow,
  RedistributionSortField,
  StationDetail,
  StationSummary,
  UserDetail,
  UserSummary,
} from "../models";

export function toRedistributionOrderBy(
  req: PageRequest<RedistributionSortField>,
): PrismaTypes.RedistributionRequestOrderByWithRelationInput {
  const sortBy = req.sortBy ?? "createdAt";
  const sortDir = req.sortDir ?? "desc";
  switch (sortBy) {
    case "completedAt":
      return { completedAt: sortDir };
    case "startedAt":
      return { startedAt: sortDir };
    case "createdAt":
    default:
      return { createdAt: sortDir };
  }
}

function mapStationSummary(station: any): StationSummary | null {
  if (!station)
    return null;
  return {
    id: station.id,
    name: station.name,
    latitude: station.latitude,
    longitude: station.longitude,
  } as any;
}

function mapStationDetail(station: any): StationDetail | null {
  if (!station)
    return null;
  const inStationBikesCount = station.bikes
    ? Math.min(
        station.totalCapacity,
        station.bikes.filter((b: any) =>
          ["AVAILABLE", "RESERVED", "PENDING_DISPATCH", "BROKEN", "FIXED"].includes(b.status),
        ).length,
      )
    : 0;

  const availableBikesCount = station.bikes ? station.bikes.filter((b: any) => b.status === "AVAILABLE").length : 0;

  return {
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    totalCapacity: station.totalCapacity,
    totalInStationBikes: inStationBikesCount,
    availableBikes: availableBikesCount,
    updatedAt: station.updatedAt,
  };
}

function mapUserSummary(user: any): UserSummary | null {
  if (!user)
    return null;
  return {
    id: user.id,
    fullName: user.fullName,
  };
}

function mapUserDetail(user: any): UserDetail | null {
  if (!user)
    return null;
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    verify: user.verify,
    location: user.location,
    username: user.username,
    phoneNumber: user.phoneNumber,
    avatar: user.avatar,
    role: user.role,
    nfcCardUid: user.assignedNfcCard?.uid ?? null,
    updatedAt: user.updatedAt,
  };
}

export const redistributionRequestItemSelect = {
  id: true,
  redistributionRequestId: true,
  bike: {
    select: {
      id: true,
      bikeNumber: true,
      status: true,
      supplierId: true,
      updatedAt: true,
    },
  },
  deliveredAt: true,
  createdAt: true,
};

const detailedUserSelect = {
  id: true,
  fullName: true,
  email: true,
  verifyStatus: true,
  locationText: true,
  username: true,
  phoneNumber: true,
  avatarUrl: true,
  role: true,
  assignedNfcCard: {
    select: {
      uid: true,
    },
  },
  updatedAt: true,
};

const detailedStationSelect = {
  id: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  totalCapacity: true,
  updatedAt: true,
  bikes: {
    select: {
      status: true,
    },
  },
};

const summaryUserSelect = {
  id: true,
  fullName: true,
};

const summaryStationSelect = {
  id: true,
  name: true,
  latitude: true,
  longitude: true,
};

export const detailedRedistributionRequestSelect = {
  id: true,
  requestedByUser: {
    select: detailedUserSelect,
  },
  approvedByUser: {
    select: detailedUserSelect,
  },
  rejectedByUser: {
    select: detailedUserSelect,
  },
  revertedByUser: {
    select: detailedUserSelect,
  },
  sourceStation: {
    select: detailedStationSelect,
  },
  targetStation: {
    select: detailedStationSelect,
  },
  sourceAvailableBikesBefore: true,
  targetAvailableBikesBefore: true,
  requestedQuantity: true,
  reason: true,
  items: {
    select: redistributionRequestItemSelect,
  },
  status: true,
  priorityScore: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const summaryRedistributionRequestItemSelect = {
  id: true,
  redistributionRequestId: true,
  bikeId: true,
  deliveredAt: true,
  createdAt: true,
};

export const summaryRedistributionRequestSelect = {
  id: true,
  requestedByUser: {
    select: summaryUserSelect,
  },
  approvedByUser: {
    select: summaryUserSelect,
  },
  rejectedByUser: {
    select: summaryUserSelect,
  },
  revertedByUser: {
    select: summaryUserSelect,
  },
  sourceStation: {
    select: summaryStationSelect,
  },
  targetStation: {
    select: summaryStationSelect,
  },
  sourceAvailableBikesBefore: true,
  targetAvailableBikesBefore: true,
  requestedQuantity: true,
  reason: true,
  items: {
    select: summaryRedistributionRequestItemSelect,
  },
  status: true,
  priorityScore: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const redistributionRequestSelect = {
  id: true,
  requestedByUserId: true,
  approvedByUserId: true,
  rejectedByUserId: true,
  revertedByUserId: true,
  sourceStationId: true,
  targetStationId: true,
  sourceAvailableBikesBefore: true,
  targetAvailableBikesBefore: true,
  requestedQuantity: true,
  reason: true,
  items: {
    select: summaryRedistributionRequestItemSelect,
  },
  status: true,
  priorityScore: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type DetailedRedistributionRequestSelectRow
  = PrismaTypes.RedistributionRequestGetPayload<{
    select: typeof detailedRedistributionRequestSelect;
  }>;

type SummaryRedistributionRequestSelectRow
  = PrismaTypes.RedistributionRequestGetPayload<{
    select: typeof summaryRedistributionRequestSelect;
  }>;

type RedistributionRequestSelectRow
  = PrismaTypes.RedistributionRequestGetPayload<{
    select: typeof redistributionRequestSelect;
  }>;

export function mapToRedistributionRequestDetail(
  raw: DetailedRedistributionRequestSelectRow,
): RedistributionRequestDetailRow {
  return {
    id: raw.id,
    requestedByUser: mapUserDetail(raw.requestedByUser)!,
    approvedByUser: mapUserDetail(raw.approvedByUser),
    rejectedByUser: mapUserDetail(raw.rejectedByUser),
    revertedByUser: mapUserDetail(raw.revertedByUser),
    sourceStation: mapStationDetail(raw.sourceStation)!,
    targetStation: mapStationDetail(raw.targetStation)!,
    sourceAvailableBikesBefore: raw.sourceAvailableBikesBefore ?? null,
    targetAvailableBikesBefore: raw.targetAvailableBikesBefore ?? null,
    requestedQuantity: raw.requestedQuantity,
    reason: raw.reason ?? "",
    items: raw.items ?? [],
    status: raw.status,
    priorityScore: raw.priorityScore ?? undefined,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// Also use as list items
export function mapToRedistributionRequestSummaryRow(
  raw: SummaryRedistributionRequestSelectRow,
): RedistributionRequestSummaryRow {
  return {
    id: raw.id,
    requestedByUser: mapUserSummary(raw.requestedByUser)!,
    approvedByUser: mapUserSummary(raw.approvedByUser),
    rejectedByUser: mapUserSummary(raw.rejectedByUser),
    revertedByUser: mapUserSummary(raw.revertedByUser),
    sourceStation: mapStationSummary(raw.sourceStation)!,
    targetStation: mapStationSummary(raw.targetStation)!,
    sourceAvailableBikesBefore: raw.sourceAvailableBikesBefore ?? null,
    targetAvailableBikesBefore: raw.targetAvailableBikesBefore ?? null,
    requestedQuantity: raw.requestedQuantity,
    reason: raw.reason ?? "",
    items: raw.items ?? [],
    status: raw.status,
    priorityScore: raw.priorityScore ?? undefined,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapToRedistributionRequestRow(
  raw: RedistributionRequestSelectRow,
): RedistributionRequestRow {
  return {
    id: raw.id,
    requestedByUserId: raw.requestedByUserId,
    approvedByUserId: raw.approvedByUserId ?? null,
    rejectedByUserId: raw.rejectedByUserId ?? null,
    revertedByUserId: raw.revertedByUserId ?? null,
    sourceStationId: raw.sourceStationId,
    targetStationId: raw.targetStationId,
    sourceAvailableBikesBefore: raw.sourceAvailableBikesBefore ?? null,
    targetAvailableBikesBefore: raw.targetAvailableBikesBefore ?? null,
    requestedQuantity: raw.requestedQuantity,
    reason: raw.reason ?? "",
    items: raw.items ?? [],
    status: raw.status,
    priorityScore: raw.priorityScore ?? null,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
