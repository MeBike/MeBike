import { formatVietnamDateTime } from "@utils/date";

import type { Reservation } from "@/types/reservation-types";

export function formatReservationDateTime(value?: string | null) {
  if (!value) {
    return "Không có dữ liệu";
  }

  const formatted = formatVietnamDateTime(value);
  const [date = formatted, time] = formatted.split(" ");

  return time ? `${time} ${date}` : date;
}

export function getReservationIdentityTitle(reservation: Reservation) {
  if (reservation.bikeId) {
    return `Xe #${String(reservation.bikeId).slice(-4)}`;
  }

  return "Chỗ trống tại trạm";
}

export function getReservationIdentityIcon(reservation: Reservation) {
  return reservation.bikeId ? "bicycle" : "location";
}

export function getShortReservationId(reservationId: string) {
  if (reservationId.length <= 18) {
    return reservationId;
  }

  return `${reservationId.slice(0, 8)}...${reservationId.slice(-6)}`;
}
