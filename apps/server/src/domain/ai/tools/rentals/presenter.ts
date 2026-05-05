import type { ReturnSlotRow } from "@/domain/rentals";

import { returnSlotExpiresAt } from "@/domain/rentals";
import { toContractRental } from "@/http/presenters/rentals.presenter";

import type { RentalQueryToolsArgs } from "../shared/customer-tool-args";

import {
  formatLocalDateTime,
  formatMinorVnd,
  getRentalStatusLabel,
  getReturnSlotStatusLabel,
} from "../shared/customer-tool-formatters";
import { getStationByIdOrNull } from "../shared/customer-tool-lookups";

type RentalRow = Parameters<typeof toContractRental>[0];

type StationSummary = {
  address: string;
  id: string;
  name: string;
};

export async function loadStationSummaryMap(
  args: Pick<RentalQueryToolsArgs, "stationQueryService">,
  rentals: readonly RentalRow[],
) {
  const stationIds = [...new Set(rentals.flatMap(rental => [rental.startStationId, rental.endStationId].filter((stationId): stationId is string => !!stationId)))];

  const stations = await Promise.all(
    stationIds.map(async (stationId) => {
      const station = await getStationByIdOrNull(args.stationQueryService, stationId);
      return station
        ? {
            address: station.address,
            id: station.id,
            name: station.name,
          }
        : null;
    }),
  );

  return new Map(
    stations.flatMap((station): [string, StationSummary][] => station ? [[station.id, station]] : []),
  );
}

export function toRentalSummaryItem(
  rental: RentalRow,
  stationMap: ReadonlyMap<string, StationSummary>,
) {
  return {
    ...toContractRental(rental),
    endStationInfo: rental.endStationId ? stationMap.get(rental.endStationId) ?? null : null,
    endTimeDisplay: formatLocalDateTime(rental.endTime),
    startTimeDisplay: formatLocalDateTime(rental.startTime),
    startStationInfo: stationMap.get(rental.startStationId) ?? null,
    statusLabel: getRentalStatusLabel(rental.status),
    totalPriceDisplay: formatMinorVnd(rental.totalPrice),
    updatedAtDisplay: formatLocalDateTime(rental.updatedAt),
  };
}

export function toRentalDetailItem(
  rental: RentalRow,
  stationMap: ReadonlyMap<string, StationSummary>,
) {
  return {
    ...toContractRental(rental),
    depositAmountDisplay: formatMinorVnd(rental.depositAmount),
    endStationInfo: rental.endStationId ? stationMap.get(rental.endStationId) ?? null : null,
    endTimeDisplay: formatLocalDateTime(rental.endTime),
    startTimeDisplay: formatLocalDateTime(rental.startTime),
    startStationInfo: stationMap.get(rental.startStationId) ?? null,
    statusLabel: getRentalStatusLabel(rental.status),
    totalPriceDisplay: formatMinorVnd(rental.totalPrice),
    updatedAtDisplay: formatLocalDateTime(rental.updatedAt),
  };
}

export function toReturnSlotAiDetail(
  returnSlot: ReturnSlotRow,
  station: { id: string; name: string; address: string } | null,
) {
  return {
    id: returnSlot.id,
    rentalId: returnSlot.rentalId,
    userId: returnSlot.userId,
    stationId: returnSlot.stationId,
    reservedFrom: returnSlot.reservedFrom.toISOString(),
    expiresAt: returnSlotExpiresAt(returnSlot.reservedFrom).toISOString(),
    reservedFromDisplay: formatLocalDateTime(returnSlot.reservedFrom),
    status: returnSlot.status,
    statusLabel: getReturnSlotStatusLabel(returnSlot.status),
    createdAt: returnSlot.createdAt.toISOString(),
    createdAtDisplay: formatLocalDateTime(returnSlot.createdAt),
    updatedAt: returnSlot.updatedAt.toISOString(),
    updatedAtDisplay: formatLocalDateTime(returnSlot.updatedAt),
    station,
  };
}
