import type { RentalsContracts } from "@mebike/shared";

import type {
  AdminRentalDetail,
  AdminRentalListItem,
  RentalRow,
} from "@/domain/rentals";

export function toContractRental(
  row: RentalRow,
): RentalsContracts.MyRentalListResponse["data"][number] {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId ?? undefined,
    startStation: row.startStationId,
    endStation: row.endStationId ?? undefined,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime ? row.endTime.toISOString() : undefined,
    duration: row.durationMinutes ?? 0,
    totalPrice: row.totalPrice ?? undefined,
    subscriptionId: row.subscriptionId ?? undefined,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContractRentalWithPrice(
  row: RentalRow,
): RentalsContracts.RentalWithPrice {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId ?? undefined,
    startStation: row.startStationId,
    endStation: row.endStationId ?? undefined,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime ? row.endTime.toISOString() : undefined,
    duration: row.durationMinutes ?? 0,
    totalPrice: row.totalPrice ?? 0,
    subscriptionId: row.subscriptionId ?? undefined,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toContractAdminRentalListItem(
  item: AdminRentalListItem,
): RentalsContracts.AdminRentalsListResponse["data"][number] {
  return {
    id: item.id,
    user: item.user,
    bikeId: item.bikeId ?? undefined,
    status: item.status,
    startStation: item.startStationId,
    endStation: item.endStationId ?? undefined,
    startTime: item.startTime.toISOString(),
    endTime: item.endTime ? item.endTime.toISOString() : undefined,
    duration: item.durationMinutes ?? 0,
    totalPrice: item.totalPrice ?? 0,
    subscriptionId: item.subscriptionId ?? undefined,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toContractRentalListItem(
  item: AdminRentalListItem,
): RentalsContracts.RentalListResponse["data"][number] {
  if (!item.bikeId) {
    throw new Error("bikeId is required for rental list item");
  }

  return {
    id: item.id,
    user: item.user,
    bikeId: item.bikeId,
    status: item.status,
    startStation: item.startStationId,
    endStation: item.endStationId ?? undefined,
    startTime: item.startTime.toISOString(),
    endTime: item.endTime ? item.endTime.toISOString() : undefined,
    duration: item.durationMinutes ?? 0,
    totalPrice: item.totalPrice ?? 0,
    subscriptionId: item.subscriptionId ?? undefined,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toContractAdminRentalDetail(
  detail: AdminRentalDetail,
): RentalsContracts.RentalDetail {
  return {
    id: detail.id,
    user: {
      id: detail.user.id,
      fullname: detail.user.fullname,
      email: detail.user.email,
      verify: detail.user.verify,
      location: detail.user.location,
      username: detail.user.username,
      phoneNumber: detail.user.phoneNumber,
      avatar: detail.user.avatar,
      role: detail.user.role,
      nfcCardUid: detail.user.nfcCardUid ?? undefined,
      updatedAt: detail.user.updatedAt.toISOString(),
    },
    bike: detail.bike
      ? {
          id: detail.bike.id,
          chipId: detail.bike.chipId,
          status: detail.bike.status,
          supplierId: detail.bike.supplierId ?? undefined,
          updatedAt: detail.bike.updatedAt.toISOString(),
        }
      : null,
    startStation: {
      id: detail.startStation.id,
      name: detail.startStation.name,
      address: detail.startStation.address,
      latitude: detail.startStation.latitude,
      longitude: detail.startStation.longitude,
      capacity: detail.startStation.capacity,
      updatedAt: detail.startStation.updatedAt.toISOString(),
    },
    endStation: detail.endStation
      ? {
          id: detail.endStation.id,
          name: detail.endStation.name,
          address: detail.endStation.address,
          latitude: detail.endStation.latitude,
          longitude: detail.endStation.longitude,
          capacity: detail.endStation.capacity,
          updatedAt: detail.endStation.updatedAt.toISOString(),
        }
      : null,
    startTime: detail.startTime.toISOString(),
    endTime: detail.endTime ? detail.endTime.toISOString() : undefined,
    duration: detail.durationMinutes ?? 0,
    totalPrice: detail.totalPrice ?? 0,
    subscriptionId: detail.subscriptionId ?? undefined,
    status: detail.status,
    updatedAt: detail.updatedAt.toISOString(),
  };
}
