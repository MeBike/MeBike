import type { ReservationRow } from "@/domain/reservations";

import {
  toContractReservation,
  toContractReservationExpanded,
} from "@/http/presenters/reservations.presenter";

import type { ReservationToolsArgs } from "../shared/customer-tool-args";

import {
  formatLocalDateTime,
  formatMinorVnd,
  getReservationStatusLabel,
} from "../shared/customer-tool-formatters";
import { getStationByIdOrNull } from "../shared/customer-tool-lookups";

export function toReservationSummaryItem(reservation: Parameters<typeof toContractReservation>[0]) {
  return {
    ...toContractReservation(reservation),
    createdAtDisplay: formatLocalDateTime(reservation.createdAt),
    endTimeDisplay: formatLocalDateTime(reservation.endTime),
    prepaidDisplay: formatMinorVnd(Number(reservation.prepaid.toString())),
    startTimeDisplay: formatLocalDateTime(reservation.startTime),
    statusLabel: getReservationStatusLabel(reservation.status),
    updatedAtDisplay: formatLocalDateTime(reservation.updatedAt),
  };
}

export function toReservationDetailItem(detail: Parameters<typeof toContractReservationExpanded>[0]) {
  return {
    ...toContractReservationExpanded(detail),
    createdAtDisplay: formatLocalDateTime(detail.createdAt),
    endTimeDisplay: formatLocalDateTime(detail.endTime),
    prepaidDisplay: formatMinorVnd(Number(detail.prepaid.toString())),
    startTimeDisplay: formatLocalDateTime(detail.startTime),
    statusLabel: getReservationStatusLabel(detail.status),
    updatedAtDisplay: formatLocalDateTime(detail.updatedAt),
  };
}

export async function toReservationActionSuccess(
  args: Pick<ReservationToolsArgs, "stationQueryService">,
  reservation: ReservationRow,
) {
  const station = await getStationByIdOrNull(
    args.stationQueryService,
    reservation.stationId,
  );

  return {
    bikeNumber: reservation.bikeNumber,
    createdAtDisplay: formatLocalDateTime(reservation.createdAt),
    endTimeDisplay: formatLocalDateTime(reservation.endTime),
    prepaidDisplay: formatMinorVnd(Number(reservation.prepaid.toString())),
    reservation: toContractReservation(reservation),
    startTimeDisplay: formatLocalDateTime(reservation.startTime),
    station: station
      ? {
          id: station.id,
          name: station.name,
          address: station.address,
        }
      : null,
    statusLabel: getReservationStatusLabel(reservation.status),
    updatedAtDisplay: formatLocalDateTime(reservation.updatedAt),
  };
}
