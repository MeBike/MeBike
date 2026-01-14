import type { ServerContracts } from "@mebike/shared";
import type { AxiosResponse } from "axios";
import type { z } from "zod";

import fetchHttpClient from "@lib/httpClient";
import { kyClient } from "@lib/ky-client";
import { routePath, ServerRoutes } from "@lib/server-routes";

import type { Bike } from "../types/BikeTypes";

type BikeSummary = ServerContracts.BikesContracts.BikeSummary;
type BikeListQuery = z.infer<typeof ServerRoutes.bikes.listBikes.request.query>;
type BikeListResponse = z.infer<
  typeof ServerRoutes.bikes.listBikes.responses[200]["content"]["application/json"]["schema"]
>;

type BikeList = {
  data: Bike[];
  pagination: BikeListResponse["pagination"];
};

const BIKE_STATUS_MAP: Record<BikeSummary["status"], Bike["status"]> = {
  AVAILABLE: "CÓ SẴN",
  BOOKED: "ĐANG ĐƯỢC THUÊ",
  BROKEN: "BỊ HỎNG",
  RESERVED: "ĐÃ ĐẶT TRƯỚC",
  MAINTAINED: "ĐANG BẢO TRÌ",
  UNAVAILABLE: "KHÔNG CÓ SẴN",
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

function toBike(summary: BikeSummary): Bike {
  return {
    _id: summary.id,
    station_id: summary.stationId ?? "",
    status: BIKE_STATUS_MAP[summary.status],
    supplier_id: summary.supplierId ?? null,
    created_at: "",
    updated_at: "",
    chip_id: summary.chipId,
    average_rating: undefined,
    total_ratings: undefined,
  };
}

export type GetAllBikesQueryParams = BikeListQuery;
export const bikeService = {
  reportBrokenBike: async (id: string): Promise<AxiosResponse> =>
    fetchHttpClient.patch(`/bikes/report-broken/${id}`),
  getBikeByIdForAll: async (id: string): Promise<Bike> => {
    const path = routePath(ServerRoutes.bikes.getBike)
      .replace("{id}", id)
      .replace(":id", id);
    const response = await kyClient
      .get(path)
      .json<BikeSummary>();
    return toBike(response);
  },
  getAllBikes: async (params: Partial<GetAllBikesQueryParams>): Promise<BikeList> => {
    const response = await kyClient
      .get(routePath(ServerRoutes.bikes.listBikes), {
        searchParams: toSearchParams(params),
      })
      .json<BikeListResponse>();

    return {
      data: response.data.map(toBike),
      pagination: response.pagination,
    };
  },
};
