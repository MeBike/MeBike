import type { BikesContracts } from "@mebike/shared";

import type {
  BikeActivityStats,
  BikeRentalHistoryItem,
  BikeRentalStats,
  BikeRow,
  BikeStatistics,
  BikeStats,
  HighestRevenueBike,
} from "@/domain/bikes";

type BikeRating = BikesContracts.BikeSummary["rating"];
type BikeStation = BikesContracts.BikeSummary["station"];
type BikeSupplier = BikesContracts.BikeSummary["supplier"];

const defaultBikeRating: BikeRating = {
  averageRating: 0,
  totalRatings: 0,
};

export function toBikeSummary(
  row: BikeRow,
  rating: BikeRating = defaultBikeRating,
  station: BikeStation = null,
  supplier: BikeSupplier = null,
): BikesContracts.BikeSummary {
  return {
    id: row.id,
    bikeNumber: row.bikeNumber,
    stationId: row.stationId,
    station,
    supplier,
    status: row.status,
    rating,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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

export function toBikeStatistics(
  row: BikeStatistics,
): BikesContracts.BikeStatistics {
  return {
    RESERVED: row.RESERVED,
    AVAILABLE: row.AVAILABLE,
    RENTED: row.RENTED,
    UNAVAILABLE: row.UNAVAILABLE,
    BROKEN: row.BROKEN,
  };
}

export function toBikeStats(
  row: BikeStats,
): BikesContracts.BikeStats {
  return {
    id: row.id,
    totalRentals: row.totalRentals,
    totalRevenue: row.totalRevenue,
    totalDurationMinutes: row.totalDurationMinutes,
    totalReports: row.totalReports,
  };
}

export function toHighestRevenueBike(
  row: HighestRevenueBike,
): BikesContracts.HighestRevenueBike {
  return {
    bikeId: row.bikeId,
    bikeNumber: row.bikeNumber,
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
