import { bikeService } from "@services/bike.service";
import { useQuery } from "@tanstack/react-query";

async function fetchDetailBikeByID(id?: string) {
  if (!id) {
    return null;
  }
  try {
    const response = await bikeService.getBikeByIdForAll(id);
    if (response.status === 200) {
      return response.data;
    }
  }
  catch (error) {
    console.error("Error fetching bike details:", error);
  }
  return null;
}
export function useGetBikeByIDAllQuery(id?: string) {
  return useQuery({
    queryKey: ["bikes", "detail", id ?? ""],
    queryFn: () => fetchDetailBikeByID(id),
    enabled: Boolean(id),
  });
}
