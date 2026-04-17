import type { RedistributionContracts } from "@mebike/shared";

import type {
  RedistributionRequestDetailRow,
  RedistributionRequestRow,
  RedistributionRequestSummaryRow,
} from "@/domain/redistribution";

function mapStationSummary(station: any) {
  if (!station)
    return null;
  return {
    id: station.id,
    name: station.name,
  };
}

function mapStationDetail(station: any) {
  if (!station)
    return null;
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    totalCapacity: station.totalCapacity,
    updatedAt: station.updatedAt.toISOString(),
  };
}

function mapUserSummary(user: any) {
  if (!user)
    return null;
  return {
    id: user.id,
    fullName: user.fullName,
  };
}

function mapUserDetail(user: any) {
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
    updatedAt: user.updatedAt.toISOString(),
  };
}

function mapBikeDetail(bike: any) {
  if (!bike)
    return null;
  return {
    id: bike.id,
    chipId: bike.chipId,
    status: bike.status,
    supplierId: bike.supplierId,
    updatedAt: bike.updatedAt.toISOString(),
  };
}

function mapRequestItemArray(items: any[]): any[] {
  if (items.length === 0)
    return [];
  return items.map(item => ({
    id: item.id,
    redistributionRequestId: item.redistributionRequestId,
    bikeId: item.bikeId,
    deliveredAt: item.deliveredAt?.toISOString() || null,
    createdAt: item.createdAt?.toISOString() || null,
  }));
}

function mapDetailedRequestItemArray(items: any[]): any[] {
  if (items.length === 0)
    return [];
  return items.map(item => ({
    id: item.id,
    redistributionRequestId: item.redistributionRequestId,
    bike: mapBikeDetail(item.bike),
    deliveredAt: item.deliveredAt?.toISOString() || null,
    createdAt: item.createdAt?.toISOString() || null,
  }));
}

export function toContractRedistributionRequest(
  row: RedistributionRequestRow,
): RedistributionContracts.RedistributionRequest {
  return {
    id: row.id,
    requestedByUserId: row.requestedByUserId,
    approvedByUserId: row.approvedByUserId ?? undefined,
    sourceStationId: row.sourceStationId,
    targetStationId: row.targetStationId,
    requestedQuantity: row.requestedQuantity,
    reason: row.reason ?? "",
    items: mapRequestItemArray(row.items),
    status: row.status,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContractRedistributionRequestListItem(
  row: RedistributionRequestSummaryRow,
): RedistributionContracts.RedistributionRequestListItem {
  return {
    id: row.id,
    requestedByUser: mapUserSummary(row.requestedByUser)!,
    approvedByUser: mapUserSummary(row.approvedByUser),
    sourceStation: mapStationSummary(row.sourceStation)!,
    targetStation: mapStationSummary(row.targetStation)!,
    items: mapRequestItemArray(row.items),
    requestedQuantity: row.requestedQuantity ?? undefined,
    reason: row.reason,
    status: row.status,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContractRedistributionRequestDetail(
  row: RedistributionRequestDetailRow,
): RedistributionContracts.RedistributionRequestDetail {
  return {
    id: row.id,
    requestedByUser: mapUserDetail(row.requestedByUser)!,
    approvedByUser: mapUserDetail(row.approvedByUser),
    sourceStation: mapStationDetail(row.sourceStation)!,
    targetStation: mapStationDetail(row.targetStation)!,
    items: mapDetailedRequestItemArray(row.items),
    requestedQuantity: row.requestedQuantity ?? undefined,
    reason: row.reason,
    status: row.status,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
