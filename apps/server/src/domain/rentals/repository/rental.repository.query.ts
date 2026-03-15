import type { PageRequest } from "@/domain/shared/pagination";
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
import { BikeSwapStatus } from "generated/kysely/types";

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
    ...(filter.stationId ? { oldBike: { stationId: filter.stationId } } : {}),
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
} as const;

type RentalSelectRow = PrismaTypes.RentalGetPayload<{
  select: typeof rentalSelect;
}>;

export function mapToRentalRow(raw: RentalSelectRow): RentalRow {
  return {
    id: raw.id,
    userId: raw.userId,
    bikeId: raw.bikeId,
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
      fullname: true,
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
  reason: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

type StaffBikeSwapSelect = PrismaTypes.BikeSwapRequestGetPayload<{
  select: typeof staffBikeSwapRequestSelect;
}>;

function mapBikeInfo(bike: any) {
  if (!bike) return null;
  return {
    id: bike.id,
    chipId: bike.chipId,
    station: {
      id: bike.station?.id ?? "",
      name: bike.station?.name ?? "Unknown",
      address: bike.station?.address ?? "Unknown",
    },
    supplier: {
      id: bike.supplier?.id ?? "",
      name: bike.supplier?.name ?? "Unknown",
    },
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
      fullName: raw.user.fullname,
    },
    oldBike: mapBikeInfo(raw.oldBike)!,
    newBike: mapBikeInfo(raw.newBike),
    reason: raw.reason ?? "",
    status: raw.status as BikeSwapStatus,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
