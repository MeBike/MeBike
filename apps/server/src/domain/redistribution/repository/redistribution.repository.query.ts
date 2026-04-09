import type { PageRequest } from "@/domain/shared/pagination";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type {
  AdminRedistributionFilter,
  InStationRedistributionFilter,
  MyInStationRedistributionFilter,
  RedistributionRequestDetailRow,
  RedistributionRequestRow,
  RedistributionRequestSummaryRow,
  RedistributionSortField,
  StationDetail,
  StationSummary,
  UserDetail,
  UserSummary,
} from "../models";

export function toMyInStationRedistributionRequestsWhere(
  userId: string,
  stationId: string,
  filter: MyInStationRedistributionFilter,
): PrismaTypes.RedistributionRequestWhereInput {
  return {
    requestedByUserId: userId,
    sourceStationId: stationId,
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.targetStationId
      ? { targetStationId: filter.targetStationId }
      : {}),
  };
}

export function toInStationRedistributionRequestsWhere(
  stationId: string,
  filter: InStationRedistributionFilter,
): PrismaTypes.RedistributionRequestWhereInput {
  return {
    sourceStationId: stationId,
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.requestedByUserId
      ? { requestedByUserId: filter.requestedByUserId }
      : {}),
    ...(filter.approvedByUserId
      ? { approvedByUserId: filter.approvedByUserId }
      : {}),
    ...(filter.targetStationId
      ? { targetStationId: filter.targetStationId }
      : {}),
  };
}

export function toAdminRedistributionRequestsWhere(
  filter: AdminRedistributionFilter,
): PrismaTypes.RedistributionRequestWhereInput {
  return {
    ...(filter.requestedByUserId
      ? { requestedByUserId: filter.requestedByUserId }
      : {}),
    ...(filter.approvedByUserId
      ? { approvedByUserId: filter.approvedByUserId }
      : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.sourceStationId
      ? { sourceStationId: filter.sourceStationId }
      : {}),
    ...(filter.targetStationId
      ? { targetStationId: filter.targetStationId }
      : {}),
  };
}

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
  };
}

function mapStationDetail(station: any): StationDetail | null {
  if (!station)
    return null;
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    totalCapacity: station.totalCapacity,
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
    nfcCardUid: user.nfcCardUid,
    updatedAt: user.updatedAt,
  };
}

export const redistributionRequestItemSelect = {
  id: true,
  redistributionRequestId: true,
  bike: {
    select: {
      id: true,
      chipId: true,
      status: true,
      supplierId: true,
      updatedAt: true,
    },
  },
  deliveredAt: true,
  createdAt: true,
};

export const detailedRedistributionRequestSelect = {
  id: true,
  requestedByUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      verifyStatus: true,
      locationText: true,
      username: true,
      phoneNumber: true,
      avatarUrl: true,
      role: true,
      nfcCardUid: true,
      updatedAt: true,
    },
  },
  approvedByUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      verifyStatus: true,
      locationText: true,
      username: true,
      phoneNumber: true,
      avatarUrl: true,
      role: true,
      nfcCardUid: true,
      updatedAt: true,
    },
  },
  sourceStation: {
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      totalCapacity: true,
      updatedAt: true,
    },
  },
  targetStation: {
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      totalCapacity: true,
      updatedAt: true,
    },
  },
  requestedQuantity: true,
  reason: true,
  items: {
    select: redistributionRequestItemSelect,
  },
  status: true,
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
    select: {
      id: true,
      fullName: true,
    },
  },
  approvedByUser: {
    select: {
      id: true,
      fullName: true,
    },
  },
  sourceStation: {
    select: {
      id: true,
      name: true,
    },
  },
  targetStation: {
    select: {
      id: true,
      name: true,
    },
  },
  requestedQuantity: true,
  reason: true,
  items: {
    select: summaryRedistributionRequestItemSelect,
  },
  status: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const redistributionRequestSelect = {
  id: true,
  requestedByUserId: true,
  approvedByUserId: true,
  sourceStationId: true,
  targetStationId: true,
  requestedQuantity: true,
  reason: true,
  items: {
    select: summaryRedistributionRequestItemSelect,
  },
  status: true,
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
    sourceStation: mapStationDetail(raw.sourceStation)!,
    targetStation: mapStationDetail(raw.targetStation)!,
    requestedQuantity: raw.requestedQuantity,
    reason: raw.reason ?? "",
    items: raw.items ?? [],
    status: raw.status,
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
    sourceStation: mapStationSummary(raw.sourceStation)!,
    targetStation: mapStationSummary(raw.targetStation)!,
    requestedQuantity: raw.requestedQuantity,
    reason: raw.reason ?? "",
    items: raw.items ?? [],
    status: raw.status,
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
    sourceStationId: raw.sourceStationId,
    targetStationId: raw.targetStationId,
    requestedQuantity: raw.requestedQuantity,
    reason: raw.reason ?? "",
    items: raw.items ?? [],
    status: raw.status,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
