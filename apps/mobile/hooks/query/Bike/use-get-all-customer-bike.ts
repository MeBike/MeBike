import { useQuery } from "@tanstack/react-query";

import type { GetAllBikesQueryParams } from "@/screen/station-detail/api/bikes.api";

import { fetchBikes } from "@/screen/station-detail/api/bikes.api";

async function fetchAllBikes(data: Partial<GetAllBikesQueryParams>) {
  const response = await fetchBikes(data as GetAllBikesQueryParams);
  return response.data;
}
export function useGetAllBikeQuery(data: Partial<GetAllBikesQueryParams>) {
  return useQuery({
    queryKey: [
      "bikes",
      "all",
      data.page,
      data.limit,
      data.station_id,
      data.supplier_id,
      data.status,
    ],
    queryFn: () => fetchAllBikes(data),
    staleTime: 3 * 60 * 1000,
  });
}
