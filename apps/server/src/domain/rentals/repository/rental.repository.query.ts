import type { PageRequest } from "@/domain/shared/pagination";
import type { BikeSwapStatus } from "generated/kysely/types";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type {
  AdminRentalFilter,
  BikeSwapRequestRow,
  MyRentalFilter,
  RentalRow,
  RentalSortField,
  StaffBikeSwapRequestFilter,
  StaffBikeSwapRequestRow,
  StaffBikeSwapRequestSortField,
} from "../models";

export function toMyRentalsWhere(
  userId: string,
  filter: MyRentalFilter,
): PrismaTypes.RentalWhereInput {
  return {
    userId,
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.startStationId ? { startStationId: filter.startStationId } : {}),
    ...(filter.endStationId ? { endStationId: filter.endStationId } : {}),
  };
}

export function toAdminRentalsWhere(
  filter: AdminRentalFilter,
): PrismaTypes.RentalWhereInput {
  return {
    ...(filter.userId ? { userId: filter.userId } : {}),
    ...(filter.bikeId ? { bikeId: filter.bikeId } : {}),
    ...(filter.startStationId ? { startStationId: filter.startStationId } : {}),
    ...(filter.endStationId ? { endStationId: filter.endStationId } : {}),
    ...(filter.status ? { status: filter.status } : {}),
  };
}

export function toRentalOrderBy(
  req: PageRequest<RentalSortField>,
): PrismaTypes.RentalOrderByWithRelationInput {
  const sortBy = req.sortBy ?? "startTime";
  const sortDir = req.sortDir ?? "desc";
  switch (sortBy) {
    case "endTime":
      return { endTime: sortDir };
    case "status":
      return { status: sortDir };
    case "updatedAt":
      return { updatedAt: sortDir };
    case "startTime":
    default:
      return { startTime: sortDir };
  }
}

export function toStaffBikeSwapRequestsWhere(
  filter: StaffBikeSwapRequestFilter,
): PrismaTypes.BikeSwapRequestWhereInput {
  return {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.userId ? { userId: filter.userId } : {}),
    ...(filter.stationId ? { stationId: filter.stationId } : {}),
  };
}

export function toStaffBikeSwapRequestsOrderBy(
  req: PageRequest<StaffBikeSwapRequestSortField>,
): PrismaTypes.BikeSwapRequestOrderByWithRelationInput {
  const sortBy = req.sortBy ?? "createdAt";
  const sortDir = req.sortDir ?? "desc";
  switch (sortBy) {
    case "status":
      return { status: sortDir };
    case "updatedAt":
      return { updatedAt: sortDir };
    case "createdAt":
    default:
      return { createdAt: sortDir };
  }
}

export const rentalSelect = {
  id: true,
  userId: true,
  reservationId: true,
  bikeId: true,
  depositHoldId: true,
  pricingPolicyId: true,
  startStationId: true,
  endStationId: true,
  startTime: true,
  endTime: true,
  duration: true,
  totalPrice: true,
  subscriptionId: true,
  status: true,
  updatedAt: true,
} as const;

type RentalSelectRow = PrismaTypes.RentalGetPayload<{
  select: typeof rentalSelect;
}>;

export function mapToRentalRow(raw: RentalSelectRow): RentalRow {
  return {
    id: raw.id,
    userId: raw.userId,
    reservationId: raw.reservationId,
    bikeId: raw.bikeId,
    depositHoldId: raw.depositHoldId,
    pricingPolicyId: raw.pricingPolicyId,
    startStationId: raw.startStationId,
    endStationId: raw.endStationId,
    startTime: raw.startTime,
    endTime: raw.endTime,
    durationMinutes: raw.duration,
    totalPrice: raw.totalPrice === null ? null : Number(raw.totalPrice),
    subscriptionId: raw.subscriptionId,
    status: raw.status,
    updatedAt: raw.updatedAt,
  };
}

export const bikeSwapRequestSelect = {
  id: true,
  rentalId: true,
  userId: true,
  oldBikeId: true,
  newBikeId: true,
  stationId: true,
  reason: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

type BikeSwapSelect = PrismaTypes.BikeSwapRequestGetPayload<{
  select: typeof bikeSwapRequestSelect;
}>;

export function mapToBikeSwapRequestRow(
  raw: BikeSwapSelect,
): BikeSwapRequestRow {
  return {
    id: raw.id,
    rentalId: raw.rentalId,
    userId: raw.userId,
    oldBikeId: raw.oldBikeId,
    newBikeId: raw.newBikeId,
    stationId: raw.stationId!,
    reason: raw.reason ?? "",
    status: raw.status as BikeSwapStatus,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const staffBikeSwapRequestSelect = {
  id: true,
  rentalId: true,
  user: {
    select: {
      id: true,
      fullName: true,
    },
  },
  oldBike: {
    select: {
      id: true,
      chipId: true,
      station: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  newBike: {
    select: {
      id: true,
      chipId: true,
      station: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  station: {
    select: {
      id: true,
      name: true,
      address: true,
    },
  },
  reason: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

type StaffBikeSwapSelect = PrismaTypes.BikeSwapRequestGetPayload<{
  select: typeof staffBikeSwapRequestSelect;
}>;

function mapBikeInfo(bike: any) {
  if (!bike)
    return null;
  return {
    id: bike.id,
    chipId: bike.chipId,
    station: {
      id: bike.station?.id,
      name: bike.station?.name,
      address: bike.station?.address,
    },
    supplier: {
      id: bike.supplier?.id,
      name: bike.supplier?.name,
    },
  };
}

function mapStationInfo(station: any) {
  if (!station)
    return null;
  return {
    id: station.id,
    name: station.name,
    address: station.address,
  };
}

export function mapToStaffBikeSwapRequestRow(
  raw: StaffBikeSwapSelect,
): StaffBikeSwapRequestRow {
  return {
    id: raw.id,
    rentalId: raw.rentalId,
    user: {
      id: raw.user.id,
      fullName: raw.user.fullName,
    },
    oldBike: mapBikeInfo(raw.oldBike)!,
    newBike: mapBikeInfo(raw.newBike),
    station: mapStationInfo(raw.station),
    reason: raw.reason ?? "",
    status: raw.status as BikeSwapStatus,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
