import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { AdminRentalDetail, AdminRentalListItem } from "../models";

import {
  returnSlotActiveAfter,
  returnSlotExpiresAt,
} from "../services/commands/return-slot-expiry";

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
      fullName: true,
    },
  },
  bike: {
    select: {
      bikeNumber: true,
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
      fullname: item.user.fullName,
    },
    bikeId: item.bikeId,
    bikeNumber: item.bike?.bikeNumber ?? null,
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
  bike: {
    select: {
      id: true,
      bikeNumber: true,
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
      totalCapacity: true,
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
      totalCapacity: true,
      updatedAt: true,
    },
  },
  returnSlotReservations: {
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      id: true,
      reservedFrom: true,
      status: true,
      station: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  },
} as const;

type AdminRentalDetailSelectRow = PrismaTypes.RentalGetPayload<{
  select: typeof adminRentalDetailSelect;
}>;

export function mapToAdminRentalDetail(raw: AdminRentalDetailSelectRow): AdminRentalDetail {
  const candidateReturnSlot = raw.returnSlotReservations[0] ?? null;
  const activeReturnSlot = candidateReturnSlot
    && candidateReturnSlot.reservedFrom > returnSlotActiveAfter(new Date())
    ? candidateReturnSlot
    : null;

  return {
    id: raw.id,
    user: {
      id: raw.user.id,
      fullname: raw.user.fullName,
      email: raw.user.email,
      verify: raw.user.verifyStatus,
      location: raw.user.locationText ?? "",
      username: raw.user.username ?? "",
      phoneNumber: raw.user.phoneNumber ?? "",
      avatar: raw.user.avatarUrl ?? "",
      role: raw.user.role,
      nfcCardUid: raw.user.nfcCardUid,
      updatedAt: raw.user.updatedAt,
    },
    bike: {
      id: raw.bike.id,
      bikeNumber: raw.bike.bikeNumber,
      status: raw.bike.status,
      supplierId: raw.bike.supplierId,
      updatedAt: raw.bike.updatedAt,
    },
    startStation: {
      id: raw.startStation.id,
      name: raw.startStation.name,
      address: raw.startStation.address,
      latitude: raw.startStation.latitude,
      longitude: raw.startStation.longitude,
      totalCapacity: raw.startStation.totalCapacity,
      updatedAt: raw.startStation.updatedAt,
    },
    endStation: raw.endStation
      ? {
          id: raw.endStation.id,
          name: raw.endStation.name,
          address: raw.endStation.address,
          latitude: raw.endStation.latitude,
          longitude: raw.endStation.longitude,
          totalCapacity: raw.endStation.totalCapacity,
          updatedAt: raw.endStation.updatedAt,
        }
      : null,
    returnSlot: activeReturnSlot
      ? {
          id: activeReturnSlot.id,
          reservedFrom: activeReturnSlot.reservedFrom,
          expiresAt: returnSlotExpiresAt(activeReturnSlot.reservedFrom),
          status: activeReturnSlot.status,
          station: {
            id: activeReturnSlot.station.id,
            name: activeReturnSlot.station.name,
            address: activeReturnSlot.station.address,
          },
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
