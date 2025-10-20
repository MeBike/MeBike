import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@services/bikeService";
import type { GetAllBikesQueryParams } from "@services/bikeService";

const fetchAllBikes = async (data: Partial<GetAllBikesQueryParams>) => {
  const response = await bikeService.getAllBikes(data as GetAllBikesQueryParams);
  console.log("Query Response:", response.data.data);
  return response.data.data;
};
export const useGetAllBikeQuery = (data: Partial<GetAllBikesQueryParams>) => {
  console.log("Query Params:", data);
  return useQuery({
    queryKey: ["bikes", "all", data.page, data.limit, data.station_id, data.supplier_id, data.status],
    queryFn: () => fetchAllBikes(data),
    staleTime: 3 * 60 * 1000,

    });
};