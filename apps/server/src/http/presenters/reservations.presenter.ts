import type { ReservationsContracts } from "@mebike/shared";

import type { ReservationRow } from "@/domain/reservations";

type ReservationResponseItem = ReservationsContracts.ReservationDetailResponse["data"];

export function toContractReservation(row: ReservationRow): ReservationResponseItem {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId ?? undefined,
    stationId: row.stationId,
    reservationOption: row.reservationOption,
    fixedSlotTemplateId: row.fixedSlotTemplateId ?? undefined,
    subscriptionId: row.subscriptionId ?? undefined,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime ? row.endTime.toISOString() : undefined,
    prepaid: row.prepaid.toString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
