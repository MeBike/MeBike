import type { StationsContracts } from "@mebike/shared";

import type { NearestStationRow, StationRow } from "@/domain/stations";

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
      pickupSlotLimit: station.pickupSlotLimit,
      returnSlotLimit: station.returnSlotLimit,
      emptyPhysicalSlots: station.emptySlots,
    },
    bikes: {
      total: station.totalBikes,
      available: station.availableBikes,
      booked: station.bookedBikes,
      broken: station.brokenBikes,
      reserved: station.reservedBikes,
      maintained: station.maintainedBikes,
      unavailable: station.unavailableBikes,
    },
    returnSlots: {
      active: station.activeReturnSlots,
      available: station.availableReturnSlots,
    },
    createdAt: station.createdAt,
    updatedAt: station.updatedAt,
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
