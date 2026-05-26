import type { AgenciesContracts } from "@mebike/shared";

import type {
  AgencyDetailRow,
  AgencyOperationalStats,
  AgencyRow,
} from "@/domain/agencies";

function toAgencyContract(
  row: AgencyRow,
): AgenciesContracts.AgencySummary {
  return {
    id: row.id,
    name: row.name,
    contactPhone: row.contactPhone,
    status: row.status,
    station: row.station
      ? {
          id: row.station.id,
          name: row.station.name,
          address: row.station.address,
          latitude: row.station.latitude,
          longitude: row.station.longitude,
          stationType: row.station.stationType,
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAgencySummary(
  row: AgencyRow,
): AgenciesContracts.AgencySummary {
  return toAgencyContract(row);
}

export function toAgencyDetail(
  row: AgencyDetailRow,
): AgenciesContracts.AgencyDetailResponse {
  return {
    id: row.id,
    name: row.name,
    contactPhone: row.contactPhone,
    status: row.status,
    station: row.station
      ? {
          id: row.station.id,
          name: row.station.name,
          address: row.station.address,
          stationType: row.station.stationType,
          location: {
            latitude: row.station.latitude,
            longitude: row.station.longitude,
          },
          capacity: {
            total: row.station.totalCapacity,
            totalInStationBikes: row.station.totalInStationBikes,
            returnSlotLimit: row.station.returnSlotLimit,
            totalActiveSlots: Math.min(
              row.station.totalCapacity,
              row.station.activeReturnSlots + row.station.incomingRedistributionBikes,
            ),
            emptyPhysicalSlots: row.station.emptySlots,
          },
          bikes: {
            total: row.station.totalBikes,
            available: row.station.availableBikes,
            booked: row.station.bookedBikes,
            broken: row.station.brokenBikes,
            reserved: row.station.reservedBikes,
            pendingDispatch: row.station.pendingDispatchBikes,
            transporting: row.station.transportingBikes,
            swapping: row.station.swappingBikes,
            lost: row.station.lostBikes,
            disabled: row.station.disabledBikes,
          },
          returnSlots: {
            active: row.station.activeReturnSlots,
            available: row.station.availableReturnSlots,
          },
          redistributionSlots: row.station.incomingRedistributionBikes,
          needsRedistribution: row.station.needsRedistribution,
          createdAt: row.station.createdAt,
          updatedAt: row.station.updatedAt,
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAgencyOperationalStats(
  stats: AgencyOperationalStats,
): AgenciesContracts.AgencyOperationalStatsResponse {
  return {
    agency: toAgencySummary(stats.agency),
    period: {
      from: stats.period.from.toISOString(),
      to: stats.period.to.toISOString(),
    },
    operators: stats.operators,
    currentStation: stats.currentStation,
    pickups: stats.pickups,
    returns: stats.returns,
    incidents: stats.incidents,
  };
}
