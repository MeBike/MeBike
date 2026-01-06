import type { BikesContracts } from "@mebike/shared";

import type {
  BikeActivityStats,
  BikeRentalHistoryItem,
  BikeRentalStats,
  BikeRow,
  HighestRevenueBike,
} from "@/domain/bikes";

export function toBikeSummary(row: BikeRow): BikesContracts.BikeSummary {
  return {
    id: row.id,
    chipId: row.chipId,
    stationId: row.stationId,
    supplierId: row.supplierId,
    status: row.status,
  };
}

export function toBikeRentalStats(
  row: BikeRentalStats,
): BikesContracts.BikeRentalStats {
  return {
    totalActiveBikes: row.totalActiveBikes,
    rentedBikes: row.rentedBikes,
    percentage: row.percentage,
  };
}

export function toHighestRevenueBike(
  row: HighestRevenueBike,
): BikesContracts.HighestRevenueBike {
  return {
    bikeId: row.bikeId,
    bikeChipId: row.bikeChipId,
    totalRevenue: row.totalRevenue,
    rentalCount: row.rentalCount,
    station: row.station
      ? { id: row.station.id, name: row.station.name }
      : null,
  };
}

export function toBikeActivityStats(
  row: BikeActivityStats,
): BikesContracts.BikeActivityStats {
  return {
    bikeId: row.bikeId,
    totalMinutesActive: row.totalMinutesActive,
    totalReports: row.totalReports,
    uptimePercentage: row.uptimePercentage,
    monthlyStats: row.monthlyStats.map(m => ({
      year: m.year,
      month: m.month,
      rentalsCount: m.rentalsCount,
      minutesActive: m.minutesActive,
      revenue: m.revenue,
    })),
  };
}

export function toBikeRentalHistoryItem(
  row: BikeRentalHistoryItem,
): BikesContracts.BikeRentalHistoryItem {
  return {
    id: row.id,
    startTime: row.startTime.toISOString(),
    ...(row.endTime ? { endTime: row.endTime.toISOString() } : {}),
    ...(row.duration !== null ? { duration: row.duration } : {}),
    ...(row.totalPrice !== null ? { totalPrice: row.totalPrice } : {}),
    user: { id: row.user.id, fullname: row.user.fullname },
    startStation: { id: row.startStation.id, name: row.startStation.name },
    ...(row.endStation ? { endStation: row.endStation } : {}),
  };
}
