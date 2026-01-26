import type { StationGraphql } from "@lib/mappers/station";

import fetchHttpClient from "@lib/httpClient";
import { toStationType } from "@lib/mappers/station";
import { print } from "graphql";

import { GET_STATIONS } from "@/graphql";

type StationsQueryResult = {
  data?: {
    Stations?: {
      data?: StationGraphql[];
      pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };
  };
};

export async function fetchStations(params?: {
  page?: number;
  limit?: number;
}) {
  const response = await fetchHttpClient.query<StationsQueryResult>(
    print(GET_STATIONS),
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 30,
      },
    },
  );

  const stations = response.data?.data?.Stations?.data ?? [];
  const pagination = response.data?.data?.Stations?.pagination;

  return {
    stations: stations.map(toStationType),
    pagination,
  };
}
