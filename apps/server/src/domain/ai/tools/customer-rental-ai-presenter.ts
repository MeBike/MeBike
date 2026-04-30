import { toContractRental } from "@/http/presenters/rentals.presenter";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {
  formatLocalDateTime,
  formatMinorVnd,
  getRentalStatusLabel,
  getStationByIdOrNull,
} from "./customer-tool-helpers";

type RentalRow = Parameters<typeof toContractRental>[0];

type StationSummary = {
  address: string;
  id: string;
  name: string;
};

export async function loadStationSummaryMap(
  args: CreateCustomerToolsArgs,
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
