import type { z } from "zod";

import type { StationListResponse, StationReadSummary } from "@/contracts/server";

import { kyClient } from "@lib/ky-client";
import { routePath, ServerRoutes } from "@lib/server-routes";

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

export const stationService = {
  getAllStations: async (params?: StationListQuery): Promise<StationReadSummary[]> => {
    const response = await kyClient
      .get(routePath(ServerRoutes.stations.listStations), {
        searchParams: toSearchParams(params),
      })
      .json<StationListResponse>();

    return response.data;
  },
  getStationById: async (stationId: string): Promise<StationReadSummary> => {
    const path = routePath(ServerRoutes.stations.getStation)
      .replace(":stationId", stationId);
    const response = await kyClient
      .get(path)
      .json<StationReadSummary>();

    return response;
  },
  getNearMe: async (
    latitude: number,
    longitude: number,
    options?: NearbyStationsOptions,
  ): Promise<StationReadSummary[]> => {
    const response = await kyClient
      .get(routePath(ServerRoutes.stations.getNearbyStations), {
        searchParams: toSearchParams({
          latitude,
          longitude,
          ...options,
        }),
      })
      .json<StationListResponse>();

    return response.data;
  },
};
