import type { ReservationsContracts } from "@mebike/shared";

import type { ReservationExpandedDetailRow, ReservationRow } from "@/domain/reservations";

type ReservationListItem = ReservationsContracts.ReservationDetail;
type ReservationExpandedDetail = ReservationsContracts.ReservationExpandedDetail;

export function toContractReservation(row: ReservationRow): ReservationListItem {
  return {
    id: row.id,
    userId: row.userId,
    bikeId: row.bikeId ?? undefined,
    bikeNumber: row.bikeNumber ?? undefined,
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

export function toContractReservationExpanded(
  row: ReservationExpandedDetailRow,
): ReservationExpandedDetail {
  return {
    ...toContractReservation(row),
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
      username: row.user.username,
      email: row.user.email,
      phoneNumber: row.user.phoneNumber,
      avatar: row.user.avatar,
      role: row.user.role,
    },
    bike: row.bike
      ? {
          id: row.bike.id,
          bikeNumber: row.bike.bikeNumber,
          chipId: row.bike.chipId,
          status: row.bike.status,
        }
      : null,
    station: {
      id: row.station.id,
      name: row.station.name,
      address: row.station.address,
      latitude: row.station.latitude,
      longitude: row.station.longitude,
    },
  };
}
