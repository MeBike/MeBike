import type { GetAllBikesQueryParams } from "@services/bike.service";

import { useCallback } from "react";

import { useGetAllBikeQuery } from "./query/Bike/use-get-all-bike-query";
import { useGetBikeByIDAllQuery } from "./query/Bike/use-get-bike-by-id-query";

type BikeActionsProps = {
  hasToken: boolean;
  bikeId?: string;
  stationId?: string;
  page?: number;
  limit?: number;
  status?: GetAllBikesQueryParams["status"];
};
export function useBikeActions({ hasToken, bikeId, stationId, page, limit, status }: BikeActionsProps) {
  const {
    refetch: useGetBikes,
    data: allBikesResponse,
    isFetching: isFetchingAllBikes,
  } = useGetAllBikeQuery({
    page: page || 1,
    pageSize: limit || 20,
    stationId,
    status,
  });

  const allBikes = allBikesResponse?.data || [];
  const totalRecords = allBikesResponse?.pagination?.total || 0;
  const {
    refetch: useGetDetailBike,
    data: detailBike,
    isFetching: isFetchingBikeDetail,
  } = useGetBikeByIDAllQuery(bikeId || "");
  const getBikes = useCallback(() => {
    if (!hasToken) {
      return;
    }
    useGetBikes();
  }, [useGetBikes, hasToken]);
  const getBikeByID = useCallback(() => {
    if (!hasToken) {
      return;
    }
    useGetDetailBike();
  }, [useGetDetailBike]);
  return {
    getBikes,
    getBikeByID,
    isFetchingBikeDetail,
    isFetchingBike: isFetchingBikeDetail,
    useGetBikes,
    useGetAllBikeQuery,
    isFetchingAllBikes,
    allBikes: Array.isArray(allBikes) ? allBikes : [],
    totalRecords,
    detailBike: detailBike ?? null,
  };
}
