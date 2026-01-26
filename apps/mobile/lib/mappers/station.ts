import type { z } from "zod";

import type { StationType } from "../../types/StationType";
import type { StationGraphqlSchema } from "../schemas/stations.schema";

export type StationGraphql = z.infer<typeof StationGraphqlSchema>;

export function toStationType(station: StationGraphql): StationType {
  const capacity = Number(station.capacity) || 0;
  const totalBikes = Number(station.totalBike) || 0;

  return {
    _id: station.id,
    name: station.name,
    address: station.address,
    latitude: String(station.latitude),
    longitude: String(station.longitude),
    capacity: String(station.capacity),
    created_at: station.createdAt ?? "",
    updated_at: station.updatedAt ?? "",
    totalBikes,
    availableBikes: Number(station.availableBike) || 0,
    bookedBikes: Number(station.bookedBike) || 0,
    brokenBikes: Number(station.brokenBike) || 0,
    reservedBikes: Number(station.reservedBike) || 0,
    maintainedBikes: Number(station.maintanedBike) || 0,
    emptySlots: Math.max(0, capacity - totalBikes),
    average_rating: undefined,
    total_ratings: undefined,
  };
}
