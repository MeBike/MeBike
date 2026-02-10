import type { GetAllBikesQueryParams } from "@services/bike.service";

import { bikeService } from "@services/bike.service";
import { useQuery } from "@tanstack/react-query";

async function fetchAllBikes(data: Partial<GetAllBikesQueryParams>) {
  const response = await bikeService.getAllBikes(data as GetAllBikesQueryParams);
  return response;
}
export function useGetAllBikeQuery(data: Partial<GetAllBikesQueryParams>) {
  return useQuery({
    queryKey: ["bikes", "all", data.page, data.pageSize, data.stationId, data.supplierId, data.status],
    queryFn: () => fetchAllBikes(data),
    staleTime: 3 * 60 * 1000,
  });
}
