import type { Reservation } from "../types/reservation-types";

import {
  getReservationStatusLabel,
  reservationStatusColors,
} from "./reservation";

export const statusColorMap: Record<Reservation["status"], string> = reservationStatusColors;
export { getReservationStatusLabel };

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "Không có dữ liệu";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Không có dữ liệu";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatCurrency(
  value?: number | string | { $numberDecimal?: string },
): string {
  if (value === null || value === undefined) {
    return "0 đ";
  }
  let amount = 0;
  if (typeof value === "number") {
    amount = value;
  }
  else if (typeof value === "string") {
    const parsed = Number(value);
    amount = Number.isFinite(parsed) ? parsed : 0;
  }
  else if (typeof value === "object" && "$numberDecimal" in value) {
    const parsed = Number(value.$numberDecimal);
    amount = Number.isFinite(parsed) ? parsed : 0;
  }
  if (!Number.isFinite(amount)) {
    amount = 0;
  }
  return `${amount.toLocaleString("vi-VN")} đ`;
}
