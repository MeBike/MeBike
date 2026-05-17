import type { BikeRow } from "@/domain/bikes";

import { VIETNAM_TIME_ZONE } from "@/domain/shared/business-hours";

const rentalStatusLabels = {
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
  OVERDUE_UNRETURNED: "Quá hạn chưa trả",
  RENTED: "Đang hoạt động",
} as const;

const reservationStatusLabels = {
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
  FULFILLED: "Đã hoàn thành",
  PENDING: "Đang chờ xử lý",
} as const;

const bikeStatusLabels = {
  AVAILABLE: "Có sẵn",
  BOOKED: "Đang được thuê",
  BROKEN: "Bị hỏng",
  RESERVED: "Đã đặt trước",
  LOST: "Xe bị mất",
  DISABLED: "Đã bị vô hiệu hóa",
  FIXED: "Đã sửa chữa",
  PENDING_DISPATCH: "Chờ điều phối",
  TRANSPORTING: "Đang vận chuyển",
  SWAPPING: "Đang đổi xe gặp sự cố",
} as const;

export const bikeRentabilityLabels = {
  AVAILABLE: "Sẵn sàng để thuê",
  BOOKED: "Đang được thuê",
  BROKEN: "Không nên sử dụng vì xe đang hỏng",
  NO_STATION: "Không thể thuê vì xe không ở trạm nào",
  RESERVED: "Không sẵn sàng để thuê vì xe đã được đặt trước",
  LOST: "Không nên sử dụng vì xe bị mất",
  DISABLED: "Không sẵn sàng để thuê vì xe đã bị vô hiệu hóa",
  FIXED: "Không sẵn sàng để thuê vì xe vừa được sửa chữa",
  PENDING_DISPATCH: "Không sẵn sàng để thuê vì xe đang chờ điều phối",
  TRANSPORTING: "Không sẵn sàng để thuê vì xe đang được vận chuyển",
  SWAPPING: "Không sẵn sàng để thuê vì xe đang trong quá trình đổi xe gặp sự cố",
} as const;

const returnSlotStatusLabels = {
  ACTIVE: "Đang giữ chỗ",
  CANCELLED: "Đã hủy",
  USED: "Đã sử dụng",
} as const;

export function formatMinorVnd(value: bigint | number | null): string | null {
  if (value === null) {
    return null;
  }

  const numeric = typeof value === "bigint" ? Number(value) : value;
  return `${new Intl.NumberFormat("vi-VN").format(numeric)} VND`;
}

export function formatLocalDateTime(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
  });
}

export function getRentalStatusLabel(status: keyof typeof rentalStatusLabels) {
  return rentalStatusLabels[status];
}

export function getReservationStatusLabel(status: keyof typeof reservationStatusLabels) {
  return reservationStatusLabels[status];
}

export function getBikeStatusLabel(status: keyof typeof bikeStatusLabels) {
  return bikeStatusLabels[status];
}

export function getReturnSlotStatusLabel(status: keyof typeof returnSlotStatusLabels) {
  return returnSlotStatusLabels[status];
}

export function getBikeRentabilityReason(bike: Pick<BikeRow, "stationId" | "status">): "NO_STATION" | BikeRow["status"] {
  if (!bike.stationId) {
    return "NO_STATION";
  }

  return bike.status;
}
