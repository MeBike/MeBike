import fetchHttpClient from "@lib/httpClient";
import { toStationType } from "@lib/mappers/station";
import { print } from "graphql";

import { GET_STATIONS } from "@/graphql";
import { StationsResponseSchema } from "@/lib/schemas/stations.schema";
import { parseOrWarn } from "@/lib/validation/parse-or-warn";

export async function fetchStations(params?: {
  page?: number;
  limit?: number;
}) {
  const response = await fetchHttpClient.query(print(GET_STATIONS), {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 30,
    },
  });

  const parsed = parseOrWarn(
    StationsResponseSchema,
    response.data,
    { op: "Stations" },
    { data: { Stations: { data: [], pagination: undefined } } },
  );

  const stations = parsed.data.data?.Stations?.data ?? [];
  const pagination = parsed.data.data?.Stations?.pagination;

  return {
    stations: stations.map(toStationType),
    pagination,
  };
}
