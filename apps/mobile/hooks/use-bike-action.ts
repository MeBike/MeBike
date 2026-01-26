import { useCallback } from "react";

import { useBikeDetailQuery } from "@/screen/bike-detail/hooks/use-bike-detail-query";
import { useBikesQuery } from "@/screen/station-detail/hooks/use-bikes-query";

type BikeActionsProps = {
  hasToken: boolean;
  bike_id?: string;
  station_id?: string;
  page?: number;
  limit?: number;
};
export function useBikeActions({
  hasToken,
  bike_id,
  station_id,
  page,
  limit,
}: BikeActionsProps) {
  const {
    refetch: useGetBikes,
    data: allBikesResponse,
    isFetching: isFetchingAllBikes,
  } = useBikesQuery({ page: page || 1, limit: limit || 20, station_id });

  const allBikes = allBikesResponse?.data || [];
  const totalRecords = allBikesResponse?.pagination?.totalRecords || 0;
  const {
    refetch: useGetDetailBike,
    data: detailBike,
    isFetching: isFetchingBikeDetail,
  } = useBikeDetailQuery(bike_id);
  const getBikes = useCallback(() => {
    if (!hasToken) {
      return;
    }
    useGetBikes();
  }, [useGetBikes, hasToken]);
  const getBikeByID = useCallback(() => {
    if (!hasToken || !bike_id) {
      return;
    }
    useGetDetailBike();
  }, [useGetDetailBike, hasToken, bike_id]);
  return {
    getBikes,
    getBikeByID,
    isFetchingBikeDetail,
    isFetchingBike: isFetchingBikeDetail,
    useGetBikes,
    isFetchingAllBikes,
    allBikes: Array.isArray(allBikes) ? allBikes : [],
    totalRecords,
    detailBike: detailBike?.result,
  };
}
