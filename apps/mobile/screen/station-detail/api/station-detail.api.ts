import type { StationGraphql } from "@lib/mappers/station";

import fetchHttpClient from "@lib/httpClient";
import { toStationType } from "@lib/mappers/station";
import { print } from "graphql";

import { GET_DETAIL_STATION } from "@/graphql";

type StationDetailQueryResult = {
  data?: {
    Station?: {
      data?: StationGraphql | null;
    };
  };
};

export async function fetchStationDetail(stationId?: string) {
  if (!stationId) {
    return null;
  }
  const response = await fetchHttpClient.query<StationDetailQueryResult>(
    print(GET_DETAIL_STATION),
    {
      stationId,
    },
  );

  const station = response.data?.data?.Station?.data ?? null;
  return station ? toStationType(station) : null;
}
