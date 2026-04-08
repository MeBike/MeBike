import type { ReservationOption, ReservationStatus } from "@/types/reservation-types";

import { reservationStatusColors as reservationStatusPalette } from "@/theme/colors";

export const reservationStatusColors: Record<ReservationStatus, string> = reservationStatusPalette;

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  PENDING: "Đang chờ xử lý",
  FULFILLED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

export function getReservationStatusLabel(status: ReservationStatus) {
  return reservationStatusLabels[status] ?? status;
}

export function getReservationStatusTone(status: ReservationStatus) {
  switch (status) {
    case "PENDING":
      return "warning" as const;
    case "CANCELLED":
      return "danger" as const;
    case "FULFILLED":
    case "EXPIRED":
    default:
      return "neutral" as const;
  }
}

export const reservationOptionLabels: Record<ReservationOption, string> = {
  ONE_TIME: "Thuê một lần",
  FIXED_SLOT: "Khung giờ cố định",
  SUBSCRIPTION: "Gói tháng",
};

export function getReservationOptionLabel(option: ReservationOption) {
  return reservationOptionLabels[option] ?? option;
}
