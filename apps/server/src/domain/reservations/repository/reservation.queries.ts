import type { PageRequest } from "@/domain/shared/pagination";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { pickDefined } from "@/domain/shared";
import { ReservationStatus } from "generated/prisma/client";

import type {
  AdminReservationFilter,
  AdminReservationSortField,
  ReservationFilter,
  ReservationSortField,
} from "../models";

const STATUS_PENDING = ReservationStatus.PENDING;

export function toReservationOrderBy(
  req: PageRequest<ReservationSortField | AdminReservationSortField>,
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
    case "createdAt":
      return { createdAt: sortDir };
    case "startTime":
    default:
      return { startTime: sortDir };
  }
}

/**
 * EN: Pending reservations. This is NOT time-aware and can match future fixed-slot rows.
 * One-time reservation flow should prefer `pendingHoldWhere(now)` or explicit status checks.
 * Use `pendingHoldWhere(now)` when you need the current hold window.
 *
 * VI: Reservation ở trạng thái "PENDING". Không xét theo thời gian và có thể
 * match cả các reservation FIXED_SLOT trong tương lai. Với flow giữ xe một lần hiện tại, hãy ưu tiên
 * `pendingHoldWhere(now)` hoặc check trạng thái tường minh.
 */
export function pendingStatusWhere(): PrismaTypes.ReservationWhereInput {
  return {
    status: STATUS_PENDING,
  };
}

/**
 * EN: "Hold" = a current bike hold window:
 * - status = PENDING
 * - bikeId is set (concrete bike)
 * - startTime <= now < endTime
 *
 * This intentionally excludes future fixed-slot reservations until their hold window starts.
 *
 * VI: "Hold" = khoảng thời gian giữ xe hiện tại:
 * - status = PENDING
 * - có bikeId (đã gán xe cụ thể)
 * - startTime <= now < endTime
 *
 * Cố ý loại FIXED_SLOT trong tương lai cho tới khi cửa sổ giữ xe thực sự bắt đầu.
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

export function toReservationWhereForAdmin(
  filter: AdminReservationFilter,
): PrismaTypes.ReservationWhereInput {
  return pickDefined({
    userId: filter.userId,
    bikeId: filter.bikeId,
    status: filter.status,
    stationId: filter.stationId,
    reservationOption: filter.reservationOption,
  });
}
