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

function mapSourceStationDetail(
  station: any,
  requestedQuantity: number,
  sourceAvailableBikesBefore: number | null,
) {
  if (!station)
    return null;

  const before = sourceAvailableBikesBefore ?? Math.min(station.availableBikes + requestedQuantity, station.totalCapacity);

  return {
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    totalCapacity: station.totalCapacity,
    availableBikesBefore: before,
    bikesForRedistribution: requestedQuantity,
    availableBikesAfter: sourceAvailableBikesBefore !== null ? Math.max(before - requestedQuantity, 0) : station.availableBikes,
    updatedAt: station.updatedAt.toISOString(),
  };
}

function mapTargetStationDetail(
  station: any,
  requestedQuantity: number,
  actualReceivedBikes: number,
  targetAvailableBikesBefore: number | null,
) {
  if (!station)
    return null;

  const before = targetAvailableBikesBefore ?? Math.max(0, station.availableBikes - actualReceivedBikes);

  return {
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    totalCapacity: station.totalCapacity,
    availableBikesBefore: before,
    actualReceivedBikes,
    actualAvailableBikes: targetAvailableBikesBefore !== null ? (before + actualReceivedBikes) : station.availableBikes,
    availableBikesAfter: targetAvailableBikesBefore !== null ? Math.min(before + requestedQuantity, station.totalCapacity) : Math.min(station.availableBikes - actualReceivedBikes + requestedQuantity, station.totalCapacity),
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
    bikeNumber: bike.bikeNumber,
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
    rejectedByUserId: row.rejectedByUserId ?? undefined,
    revertedByUserId: row.revertedByUserId ?? undefined,
    sourceStationId: row.sourceStationId,
    targetStationId: row.targetStationId,
    sourceAvailableBikesBefore: row.sourceAvailableBikesBefore,
    targetAvailableBikesBefore: row.targetAvailableBikesBefore,
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
    rejectedByUser: mapUserSummary(row.rejectedByUser),
    revertedByUser: mapUserSummary(row.revertedByUser),
    sourceStation: mapStationSummary(row.sourceStation)!,
    targetStation: mapStationSummary(row.targetStation)!,
    sourceAvailableBikesBefore: row.sourceAvailableBikesBefore,
    targetAvailableBikesBefore: row.targetAvailableBikesBefore,
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
  const actualReceivedBikes = row.items.filter(item => item.deliveredAt !== null).length;
  return {
    id: row.id,
    requestedByUser: mapUserDetail(row.requestedByUser)!,
    approvedByUser: mapUserDetail(row.approvedByUser),
    rejectedByUser: mapUserDetail(row.rejectedByUser),
    revertedByUser: mapUserDetail(row.revertedByUser),
    sourceStation: mapSourceStationDetail(
      row.sourceStation,
      row.requestedQuantity,
      row.sourceAvailableBikesBefore,
    )!,
    targetStation: mapTargetStationDetail(
      row.targetStation,
      row.requestedQuantity,
      actualReceivedBikes,
      row.targetAvailableBikesBefore,
    )!,
    sourceAvailableBikesBefore: row.sourceAvailableBikesBefore,
    targetAvailableBikesBefore: row.targetAvailableBikesBefore,
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
