import { bikeService } from "@services/bike.service";
import { useQuery } from "@tanstack/react-query";

async function fetchDetailBikeByID(id: string) {
  return bikeService.getBikeByIdForAll(id);
}
export function useGetBikeByIDAllQuery(id: string) {
  return useQuery({
    queryKey: ["bikes", "detail", id],
    queryFn: () => fetchDetailBikeByID(id),
    enabled: Boolean(id),
  });
}
