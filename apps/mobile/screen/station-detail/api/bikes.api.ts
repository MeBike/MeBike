import type { AxiosResponse } from "axios";

import fetchHttpClient from "@lib/httpClient";
import { toBikeType } from "@lib/mappers/bike";
import { BikesResponseSchema } from "@lib/schemas/bikes.schema";
import { print } from "graphql";

import { GET_BIKES } from "@/graphql";
import { parseOrWarn } from "@/lib/validation/parse-or-warn";

import type { Bike } from "../../../types/BikeTypes";

type ApiReponse<T> = {
  data: T;
  pagination?: {
    totalPages: number;
    totalRecords: number;
    limit: number;
    currentPage: number;
  };
};

export type GetAllBikesQueryParams = {
  page: number;
  limit: number;
  station_id: string;
  supplier_id: string;
  status:
    | "CÓ SẴN"
    | "ĐANG ĐƯỢC THUÊ"
    | "BỊ HỎNG"
    | "ĐÃ ĐẶT TRƯỚC"
    | "ĐANG BẢO TRÌ"
    | "KHÔNG CÓ SẴN";
};

type BikesQueryResult = typeof BikesResponseSchema._output;

export async function fetchBikes(
  data: Partial<GetAllBikesQueryParams>,
): Promise<AxiosResponse<ApiReponse<Bike[]>>> {
  const search = data.station_id || data.supplier_id || "";
  const response = await fetchHttpClient.query<BikesQueryResult>(
    print(GET_BIKES),
    {
      params: {
        page: data.page ?? 1,
        limit: data.limit ?? 20,
        search,
      },
    },
  );

  const parsed = parseOrWarn(
    BikesResponseSchema,
    response.data,
    { op: "Bikes" },
    { data: { Bikes: { data: [], pagination: undefined } } },
  );

  const result = parsed.data.data?.Bikes;
  const bikes = result?.data ?? [];
  const pagination = result?.pagination;

  return {
    ...response,
    data: {
      data: bikes.map(toBikeType),
      pagination: pagination
        ? {
            totalPages: pagination.totalPages,
            totalRecords: pagination.total,
            limit: pagination.limit,
            currentPage: pagination.page,
          }
        : undefined,
    },
  };
}
