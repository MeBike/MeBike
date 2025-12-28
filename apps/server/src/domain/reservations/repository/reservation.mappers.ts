import type { ReservationRow } from "../models";

export const selectReservationRow = {
  id: true,
  userId: true,
  bikeId: true,
  stationId: true,
  reservationOption: true,
  fixedSlotTemplateId: true,
  subscriptionId: true,
  startTime: true,
  endTime: true,
  prepaid: true,
  status: true,
  updatedAt: true,
} as const;

export function toReservationRow(row: {
  id: string;
  userId: string;
  bikeId: string | null;
  stationId: string;
  reservationOption: string;
  fixedSlotTemplateId: string | null;
  subscriptionId: string | null;
  startTime: Date;
  endTime: Date | null;
  prepaid: ReservationRow["prepaid"];
  status: string;
  updatedAt: Date;
}): ReservationRow {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId,
    stationId: row.stationId,
    reservationOption: row.reservationOption as ReservationRow["reservationOption"],
    fixedSlotTemplateId: row.fixedSlotTemplateId,
    subscriptionId: row.subscriptionId,
    startTime: row.startTime,
    endTime: row.endTime,
    prepaid: row.prepaid,
    status: row.status as ReservationRow["status"],
    updatedAt: row.updatedAt,
  };
}
