import type { BikeStatus, Prisma, PrismaClient } from "generated/prisma/client";

import type {
  AdminBikeManageableStatus,
  BikeManageableStatus,
} from "./bike-command.service.types";

import {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
  BikeStationNotFound,
  BikeStationPlacementCapacityExceeded,
  BikeSupplierNotFound,
  InvalidBikeStatus,
} from "../../domain-errors";

const ROLE_TRANSITIONS_MAP: Record<
  string,
  Partial<Record<BikeStatus, readonly BikeManageableStatus[]>>
> = {
  TECHNICIAN: {
    AVAILABLE: ["BROKEN"] as const,
    BROKEN: ["FIXED"] as const,
  },
  MANAGER: {
    AVAILABLE: ["BROKEN"] as const,
    FIXED: ["AVAILABLE"] as const,
  },
  AGENCY: {
    AVAILABLE: ["BROKEN"] as const,
    FIXED: ["AVAILABLE"] as const,
  },
  // Nhóm mặc định dành cho trường hợp không truyền role hoặc role không khớp
  DEFAULT: {
    AVAILABLE: ["BROKEN"] as const,
    BROKEN: ["FIXED"] as const,
    FIXED: ["AVAILABLE"] as const,
  },
};

export function getScopedStatusTransitions(
  currentStatus: BikeStatus,
  role?: string,
): readonly BikeManageableStatus[] {
  // Role bị scope theo station chỉ được lật trạng thái phục vụ vận hành cơ bản.
  // Không cho phép đẩy xe ra khỏi các flow booking / reservation / redistribution bằng tay.
  const roleConfig =
    ROLE_TRANSITIONS_MAP[role || "DEFAULT"] ?? ROLE_TRANSITIONS_MAP["DEFAULT"];

  return roleConfig[currentStatus] ?? ([] as const);
}

/**
 * Các chuyển trạng thái admin được phép làm thủ công.
 * Chỉ cho phép các trạng thái phục vụ vận hành/bảo trì, không cho phép admin ép xe
 * đang ở luồng thuê/đặt chỗ (`BOOKED`, `RESERVED`) quay về trạng thái sẵn sàng.
 */
export function getAdminAllowedStatusTransitions(
  currentStatus: BikeStatus,
): readonly AdminBikeManageableStatus[] {
  if (currentStatus === "AVAILABLE") {
    return ["BROKEN", "DISABLED"] as const;
  }

  if (currentStatus === "BROKEN") {
    return ["AVAILABLE"] as const;
  }

  if (currentStatus === "DISABLED") {
    return ["AVAILABLE"] as const;
  }

  return [] as const;
}

export function isBikeCreateDomainPassThroughError(
  cause: unknown,
): cause is
  | BikeStationNotFound
  | BikeStationPlacementCapacityExceeded
  | BikeSupplierNotFound {
  return (
    cause instanceof BikeStationNotFound ||
    cause instanceof BikeStationPlacementCapacityExceeded ||
    cause instanceof BikeSupplierNotFound
  );
}

export function isBikeUpdateDomainPassThroughError(
  cause: unknown,
): cause is
  | BikeCurrentlyRented
  | BikeCurrentlyReserved
  | InvalidBikeStatus
  | BikeNotFound
  | BikeStationNotFound
  | BikeStationPlacementCapacityExceeded
  | BikeSupplierNotFound {
  return (
    cause instanceof BikeCurrentlyRented ||
    cause instanceof BikeCurrentlyReserved ||
    cause instanceof InvalidBikeStatus ||
    cause instanceof BikeNotFound ||
    cause instanceof BikeStationNotFound ||
    cause instanceof BikeStationPlacementCapacityExceeded ||
    cause instanceof BikeSupplierNotFound
  );
}

/**
 * Số chỗ còn lại để admin đặt thêm xe vào trạm.
 * Phải trừ cả `activeReturnSlots` vì các chỗ đó đã được giữ cho xe đang trên đường trả về,
 * nhưng không phụ thuộc vào `returnSlotLimit` vì đó là giới hạn tạo slot mới, không phải sức chứa hiện có.
 */
export function getAvailablePlacementSlots(station: {
  totalCapacity: number;
  totalBikes: number;
  activeReturnSlots: number;
}) {
  return Math.max(
    0,
    station.totalCapacity - station.totalBikes - station.activeReturnSlots,
  );
}

export async function lockStationRow(
  tx: PrismaClient | Prisma.TransactionClient,
  stationId: string,
) {
  await tx.$queryRaw`
    SELECT id
    FROM "Station"
    WHERE id = ${stationId}::uuid
    FOR UPDATE
  `;
}

export async function lockBikeRow(
  tx: PrismaClient | Prisma.TransactionClient,
  bikeId: string,
) {
  await tx.$queryRaw`
    SELECT id
    FROM "Bike"
    WHERE id = ${bikeId}::uuid
    FOR UPDATE
  `;
}
