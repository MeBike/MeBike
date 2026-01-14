import type { ServerContracts } from "@mebike/shared";
import type { z } from "zod";

import { kyClient } from "@lib/ky-client";
import { routePath, ServerRoutes } from "@lib/server-routes";

import type { StationType } from "../types/StationType";

type StationSummary = ServerContracts.StationsContracts.StationSummary;
type StationListResponse = ServerContracts.StationsContracts.StationListResponse;

type StationListQuery = z.infer<
  typeof ServerRoutes.stations.listStations.request.query
>;
type NearbyStationsQuery = z.infer<
  typeof ServerRoutes.stations.getNearbyStations.request.query
>;
type NearbyStationsOptions = Omit<NearbyStationsQuery, "latitude" | "longitude">;

function toSearchParams(
  params: Record<string, unknown> | undefined,
): Record<string, string> | undefined {
  if (!params) {
    return undefined;
  }
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function toStationType(summary: StationSummary): StationType {
  return {
    _id: summary.id,
    name: summary.name,
    address: summary.address,
    latitude: String(summary.latitude),
    longitude: String(summary.longitude),
    capacity: String(summary.capacity),
    created_at: "",
    updated_at: "",
    totalBikes: summary.totalBikes,
    availableBikes: summary.availableBikes,
    bookedBikes: summary.bookedBikes,
    brokenBikes: summary.brokenBikes,
    reservedBikes: summary.reservedBikes,
    maintainedBikes: summary.maintainedBikes,
    emptySlots: summary.emptySlots,
    average_rating: undefined,
    total_ratings: undefined,
  };
}

export const stationService = {
  getAllStations: async (params?: StationListQuery): Promise<StationType[]> => {
    const response = await kyClient
      .get(routePath(ServerRoutes.stations.listStations), {
        searchParams: toSearchParams(params),
      })
      .json<StationListResponse>();

    return response.data.map(toStationType);
  },
  getStationById: async (stationId: string): Promise<StationType> => {
    const path = routePath(ServerRoutes.stations.getStation)
      .replace(":stationId", stationId);
    const response = await kyClient
      .get(path)
      .json<StationSummary>();

    return toStationType(response);
  },
  getNearMe: async (
    latitude: number,
    longitude: number,
    options?: NearbyStationsOptions,
  ): Promise<StationType[]> => {
    const response = await kyClient
      .get(routePath(ServerRoutes.stations.getNearbyStations), {
        searchParams: toSearchParams({
          latitude,
          longitude,
          ...options,
        }),
      })
      .json<StationListResponse>();

    return response.data.map(toStationType);
  },
};
