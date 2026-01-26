import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";
import { toBikeType } from "@lib/mappers/bike";
import { BikeDetailResponseSchema } from "@lib/schemas/bikes.schema";
import { print } from "graphql";

import { GET_DETAIL_BIKES } from "@/graphql";
import { parseOrWarn } from "@/lib/validation/parse-or-warn";

import type { Bike } from "../../../types/BikeTypes";

type DetailApiResponse<T> = {
  result: T | null;
  message: string;
};

type BikeDetailQueryResult = typeof BikeDetailResponseSchema._output;

export async function fetchBikeDetail(
  id: string,
): Promise<AxiosResponse<DetailApiResponse<Bike>>> {
  const response = await fetchHttpClient.query<BikeDetailQueryResult>(
    print(GET_DETAIL_BIKES),
    {
      bikeId: id,
    },
  );

  const parsed = parseOrWarn(
    BikeDetailResponseSchema,
    response.data,
    { op: "Bike" },
    { data: { Bike: { data: null } } },
  );
  const bike = parsed.data.data?.Bike?.data ?? null;

  return {
    ...response,
    data: {
      result: bike ? toBikeType(bike) : null,
      message: bike ? "OK" : "Bike not found",
    },
  };
}
