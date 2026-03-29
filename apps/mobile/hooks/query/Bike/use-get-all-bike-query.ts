import type { GetAllBikesQueryParams } from "@services/bike.service";
import type { BikeError } from "@services/bike-error";

import { bikeService } from "@services/bike.service";
import { useQuery } from "@tanstack/react-query";

async function fetchAllBikes(data: Partial<GetAllBikesQueryParams>) {
  const result = await bikeService.getAllBikes(data as GetAllBikesQueryParams);
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}
export function useGetAllBikeQuery(data: Partial<GetAllBikesQueryParams>) {
  return useQuery<Awaited<ReturnType<typeof fetchAllBikes>>, BikeError>({
    queryKey: ["bikes", "all", data.page, data.pageSize, data.stationId, data.supplierId, data.status],
    queryFn: () => fetchAllBikes(data),
    staleTime: 3 * 60 * 1000,
  });
}
