import type { StationsContracts } from "@mebike/shared";

import type {
  NearestStationRow,
  StationRevenueStats,
  StationRow,
} from "@/domain/stations";

export function toContractStationReadSummary(
  station: StationRow,
): StationsContracts.StationReadSummary {
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    stationType: station.stationType,
    agencyId: station.agencyId,
    location: {
      latitude: station.latitude,
      longitude: station.longitude,
    },
    capacity: {
      total: station.totalCapacity,
      returnSlotLimit: station.returnSlotLimit,
      emptyPhysicalSlots: station.emptySlots,
    },
    bikes: {
      total: station.totalBikes,
      available: station.availableBikes,
      booked: station.bookedBikes,
      broken: station.brokenBikes,
      reserved: station.reservedBikes,
      redistributing: station.redistributingBikes,
      lost: station.lostBikes,
      disabled: station.disabledBikes,
    },
    returnSlots: {
      active: station.activeReturnSlots,
      available: station.availableReturnSlots,
    },
    ...(station.workers
      ? {
          workers: station.workers.map(worker => ({
            userId: worker.userId,
            fullName: worker.fullName,
            role: worker.role,
            technicianTeamId: worker.technicianTeamId,
            technicianTeamName: worker.technicianTeamName,
          })),
        }
      : {}),
    createdAt: station.createdAt,
    updatedAt: station.updatedAt,
  };
}

export function toContractStationSummary(
  station: StationRow,
): StationsContracts.StationSummary {
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    stationType: station.stationType,
    agencyId: station.agencyId,
    totalCapacity: station.totalCapacity,
    returnSlotLimit: station.returnSlotLimit,
    latitude: station.latitude,
    longitude: station.longitude,
    createdAt: station.createdAt,
    updatedAt: station.updatedAt,
    totalBikes: station.totalBikes,
    availableBikes: station.availableBikes,
    bookedBikes: station.bookedBikes,
    brokenBikes: station.brokenBikes,
    reservedBikes: station.reservedBikes,
    redistributingBikes: station.redistributingBikes,
    lostBikes: station.lostBikes,
    disabledBikes: station.disabledBikes,
    emptySlots: station.emptySlots,
  };
}

export function toContractNearbyStation(
  station: NearestStationRow,
): StationsContracts.NearbyStation {
  return {
    ...toContractStationReadSummary(station),
    distanceMeters: station.distanceMeters,
    distanceKm: station.distanceMeters / 1000,
  };
}

export function toContractStationRevenue(
  stats: StationRevenueStats,
): StationsContracts.StationRevenueResponse {
  return {
    period: {
      from: stats.period.from.toISOString(),
      to: stats.period.to.toISOString(),
    },
    summary: {
      totalStations: stats.summary.totalStations,
      totalRevenue: stats.summary.totalRevenue,
      totalRentals: stats.summary.totalRentals,
      avgRevenuePerStation: stats.summary.avgRevenuePerStation,
    },
    stations: stats.stations.map(station => ({
      id: station.stationId,
      name: station.name,
      address: station.address,
      totalRentals: station.totalRentals,
      totalRevenue: station.totalRevenue,
      totalDuration: station.totalDuration,
      avgDuration: station.avgDuration,
    })),
    ...(stats.groupBy ? { groupBy: stats.groupBy } : {}),
    ...(stats.series
      ? {
          series: stats.series.map(item => ({
            date: item.date.toISOString(),
            totalRevenue: item.totalRevenue,
            totalRentals: item.totalRentals,
          })),
        }
      : {}),
  };
}
