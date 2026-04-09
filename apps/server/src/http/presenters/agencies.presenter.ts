import type { AgenciesContracts } from "@mebike/shared";

import type {
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
  row: AgencyRow,
): AgenciesContracts.AgencyDetailResponse {
  return toAgencyContract(row);
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
