import { useQuery } from "@tanstack/react-query";

import type { GetAllBikesQueryParams } from "@services/bikeService";

import { bikeService } from "@services/bikeService";

async function fetchAllBikes(data: Partial<GetAllBikesQueryParams>) {
  const response = await bikeService.getAllBikes(data as GetAllBikesQueryParams);
  console.log("Query Response:", response.data.data);
  return response.data.data;
}
export function useGetAllBikeQuery(data: Partial<GetAllBikesQueryParams>) {
  console.log("Query Params:", data);
  return useQuery({
    queryKey: ["bikes", "all", data.page, data.limit, data.station_id, data.supplier_id, data.status],
    queryFn: () => fetchAllBikes(data),
    staleTime: 3 * 60 * 1000,
  });
}
