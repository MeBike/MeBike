import type { StationType } from "../../types/StationType";

export type StationGraphql = {
  id: string;
  name: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  capacity: number | string;
  totalBike?: number | null;
  availableBike?: number | null;
  bookedBike?: number | null;
  brokenBike?: number | null;
  reservedBike?: number | null;
  maintanedBike?: number | null;
  unavailable?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

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
