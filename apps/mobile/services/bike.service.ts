import type { AxiosResponse } from "axios";
import type { z } from "zod";

import type { BikeSummary } from "@/contracts/server";

import fetchHttpClient from "@lib/httpClient";
import { kyClient } from "@lib/ky-client";
import { routePath, ServerRoutes } from "@lib/server-routes";

type BikeListQuery = z.infer<typeof ServerRoutes.bikes.listBikes.request.query>;
type BikeListResponse = z.infer<
  typeof ServerRoutes.bikes.listBikes.responses[200]["content"]["application/json"]["schema"]
>;

type BikeList = {
  data: BikeSummary[];
  pagination: BikeListResponse["pagination"];
};

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

export type GetAllBikesQueryParams = BikeListQuery;
export const bikeService = {
  reportBrokenBike: async (id: string): Promise<AxiosResponse> =>
    fetchHttpClient.patch(`/bikes/report-broken/${id}`),
  getBikeByIdForAll: async (id: string): Promise<BikeSummary> => {
    const path = routePath(ServerRoutes.bikes.getBike)
      .replace("{id}", id)
      .replace(":id", id);
    const response = await kyClient
      .get(path)
      .json<BikeSummary>();
    return response;
  },
  getAllBikes: async (params: Partial<GetAllBikesQueryParams>): Promise<BikeList> => {
    const response = await kyClient
      .get(routePath(ServerRoutes.bikes.listBikes), {
        searchParams: toSearchParams(params),
      })
      .json<BikeListResponse>();

    return {
      data: response.data,
      pagination: response.pagination,
    };
  },
};
