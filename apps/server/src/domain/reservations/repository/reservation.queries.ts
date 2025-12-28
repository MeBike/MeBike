import type { PageRequest } from "@/domain/shared/pagination";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { ReservationStatus } from "generated/prisma/client";

import type { ReservationFilter, ReservationSortField } from "../models";

const STATUS_PENDING = ReservationStatus.PENDING;
const STATUS_ACTIVE = ReservationStatus.ACTIVE;

export function toReservationOrderBy(
  req: PageRequest<ReservationSortField>,
): PrismaTypes.ReservationOrderByWithRelationInput {
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

/**
 * EN: "Pending or Active" reservations. This is NOT time-aware and can match future fixed-slot rows.
 * Use `pendingHoldWhere(now)` when you need the current hold window.
 *
 * VI: Reservation ở trạng thái "PENDING hoặc ACTIVE". Không xét theo thời gian và có thể match cả
 * các reservation FIXED_SLOT trong tương lai. Nếu cần "hold hiện tại" hãy dùng `pendingHoldWhere(now)`.
 */
export function activeStatusWhere(): PrismaTypes.ReservationWhereInput {
  return {
    status: { in: [STATUS_PENDING, STATUS_ACTIVE] },
  };
}

/**
 * EN: "Hold" = a current bike hold window:
 * - status = PENDING
 * - bikeId is set (concrete bike)
 * - startTime <= now < endTime
 *
 * This intentionally excludes FIXED_SLOT reservations which often have `endTime = null`.
 *
 * VI: "Hold" = khoảng thời gian giữ xe hiện tại:
 * - status = PENDING
 * - có bikeId (đã gán xe cụ thể)
 * - startTime <= now < endTime
 *
 * Cố ý loại FIXED_SLOT vì thường `endTime = null`.
 */
export function pendingHoldWhere(now: Date): PrismaTypes.ReservationWhereInput {
  return {
    status: STATUS_PENDING,
    bikeId: { not: null },
    startTime: { lte: now },
    endTime: { gt: now },
  };
}

/**
 * EN: Shared filter builder for user reservation listing.
 * VI: Hàm dựng điều kiện filter dùng chung cho danh sách reservation của user.
 */
export function toReservationWhereForUser(
  userId: string,
  filter: ReservationFilter,
): PrismaTypes.ReservationWhereInput {
  return {
    userId,
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.stationId ? { stationId: filter.stationId } : {}),
    ...(filter.reservationOption ? { reservationOption: filter.reservationOption } : {}),
  };
}
