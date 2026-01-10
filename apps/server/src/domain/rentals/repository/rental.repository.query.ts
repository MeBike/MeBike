import type { PageRequest } from "@/domain/shared/pagination";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type {
  AdminRentalFilter,
  MyRentalFilter,
  RentalRow,
  RentalSortField,
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

type RentalSelectRow = PrismaTypes.RentalGetPayload<{ select: typeof rentalSelect }>;

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
