import type { ReservationExpandedDetailRow, ReservationRow } from "../models";

export const selectReservationRow = {
  id: true,
  userId: true,
  bikeId: true,
  bike: {
    select: {
      bikeNumber: true,
    },
  },
  stationId: true,
  pricingPolicyId: true,
  reservationOption: true,
  fixedSlotTemplateId: true,
  subscriptionId: true,
  startTime: true,
  endTime: true,
  prepaid: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const selectReservationExpandedDetailRow = {
  ...selectReservationRow,
  user: {
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      phoneNumber: true,
      avatarUrl: true,
      role: true,
    },
  },
  bike: {
    select: {
      id: true,
      bikeNumber: true,
      chipId: true,
      status: true,
    },
  },
  station: {
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
    },
  },
} as const;

export function toReservationRow(row: {
  id: string;
  userId: string;
  bikeId: string | null;
  bike: {
    bikeNumber: string;
  } | null;
  stationId: string;
  pricingPolicyId: string | null;
  reservationOption: string;
  fixedSlotTemplateId: string | null;
  subscriptionId: string | null;
  startTime: Date;
  endTime: Date | null;
  prepaid: ReservationRow["prepaid"];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ReservationRow {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId,
    bikeNumber: row.bike?.bikeNumber ?? null,
    stationId: row.stationId,
    pricingPolicyId: row.pricingPolicyId,
    reservationOption: row.reservationOption as ReservationRow["reservationOption"],
    fixedSlotTemplateId: row.fixedSlotTemplateId,
    subscriptionId: row.subscriptionId,
    startTime: row.startTime,
    endTime: row.endTime,
    prepaid: row.prepaid,
    status: row.status as ReservationRow["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toReservationExpandedDetailRow(row: {
  id: string;
  userId: string;
  bikeId: string | null;
  stationId: string;
  pricingPolicyId: string | null;
  reservationOption: string;
  fixedSlotTemplateId: string | null;
  subscriptionId: string | null;
  startTime: Date;
  endTime: Date | null;
  prepaid: ReservationRow["prepaid"];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    fullName: string;
    username: string | null;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    role: string;
  };
  bike: {
    id: string;
    bikeNumber: string;
    chipId: string;
    status: string;
  } | null;
  station: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}): ReservationExpandedDetailRow {
  return {
    ...toReservationRow(row),
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
      username: row.user.username,
      email: row.user.email,
      phoneNumber: row.user.phoneNumber,
      avatar: row.user.avatarUrl,
      role: row.user.role as ReservationExpandedDetailRow["user"]["role"],
    },
    bike: row.bike
      ? {
          id: row.bike.id,
          bikeNumber: row.bike.bikeNumber,
          chipId: row.bike.chipId,
          status: row.bike.status as NonNullable<ReservationExpandedDetailRow["bike"]>["status"],
        }
      : null,
    station: {
      id: row.station.id,
      name: row.station.name,
      address: row.station.address,
      latitude: row.station.latitude,
      longitude: row.station.longitude,
    },
  };
}
