import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { AdminRentalDetail, AdminRentalListItem } from "../models";

export const adminRentalListSelect = {
  id: true,
  userId: true,
  bikeId: true,
  startStationId: true,
  endStationId: true,
  createdAt: true,
  startTime: true,
  endTime: true,
  duration: true,
  totalPrice: true,
  subscriptionId: true,
  status: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullname: true,
    },
  },
} as const;

type AdminRentalListSelectRow = PrismaTypes.RentalGetPayload<{
  select: typeof adminRentalListSelect;
}>;

export function mapToAdminRentalListItem(
  item: AdminRentalListSelectRow,
): AdminRentalListItem {
  return {
    id: item.id,
    user: {
      id: item.user.id,
      fullname: item.user.fullname,
    },
    bikeId: item.bikeId,
    status: item.status,
    startStationId: item.startStationId,
    endStationId: item.endStationId,
    createdAt: item.createdAt,
    startTime: item.startTime,
    endTime: item.endTime,
    durationMinutes: item.duration,
    totalPrice: item.totalPrice === null ? null : Number(item.totalPrice),
    subscriptionId: item.subscriptionId,
    updatedAt: item.updatedAt,
  };
}

export const adminRentalDetailSelect = {
  id: true,
  userId: true,
  bikeId: true,
  startStationId: true,
  endStationId: true,
  startTime: true,
  endTime: true,
  duration: true,
  totalPrice: true,
  subscriptionId: true,
  status: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullname: true,
      email: true,
      verify: true,
      location: true,
      username: true,
      phoneNumber: true,
      avatar: true,
      role: true,
      nfcCardUid: true,
      updatedAt: true,
    },
  },
  bike: {
    select: {
      id: true,
      chipId: true,
      status: true,
      supplierId: true,
      updatedAt: true,
    },
  },
  startStation: {
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      capacity: true,
      updatedAt: true,
    },
  },
  endStation: {
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      capacity: true,
      updatedAt: true,
    },
  },
} as const;

type AdminRentalDetailSelectRow = PrismaTypes.RentalGetPayload<{
  select: typeof adminRentalDetailSelect;
}>;

export function mapToAdminRentalDetail(raw: AdminRentalDetailSelectRow): AdminRentalDetail {
  return {
    id: raw.id,
    user: {
      id: raw.user.id,
      fullname: raw.user.fullname,
      email: raw.user.email,
      verify: raw.user.verify,
      location: raw.user.location ?? "",
      username: raw.user.username ?? "",
      phoneNumber: raw.user.phoneNumber ?? "",
      avatar: raw.user.avatar ?? "",
      role: raw.user.role,
      nfcCardUid: raw.user.nfcCardUid,
      updatedAt: raw.user.updatedAt,
    },
    bike: raw.bike
      ? {
          id: raw.bike.id,
          chipId: raw.bike.chipId,
          status: raw.bike.status,
          supplierId: raw.bike.supplierId,
          updatedAt: raw.bike.updatedAt,
        }
      : null,
    startStation: {
      id: raw.startStation.id,
      name: raw.startStation.name,
      address: raw.startStation.address,
      latitude: raw.startStation.latitude,
      longitude: raw.startStation.longitude,
      capacity: raw.startStation.capacity,
      updatedAt: raw.startStation.updatedAt,
    },
    endStation: raw.endStation
      ? {
          id: raw.endStation.id,
          name: raw.endStation.name,
          address: raw.endStation.address,
          latitude: raw.endStation.latitude,
          longitude: raw.endStation.longitude,
          capacity: raw.endStation.capacity,
          updatedAt: raw.endStation.updatedAt,
        }
      : null,
    startTime: raw.startTime,
    endTime: raw.endTime,
    durationMinutes: raw.duration,
    totalPrice: raw.totalPrice === null ? null : Number(raw.totalPrice),
    subscriptionId: raw.subscriptionId,
    status: raw.status,
    updatedAt: raw.updatedAt,
  };
}
