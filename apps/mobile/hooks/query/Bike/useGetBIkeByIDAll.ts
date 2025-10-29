import { useQuery } from "@tanstack/react-query";

import { bikeService } from "@services/bike.service";
const fetchDetailBikeByID = async (id: string) => {
  try {
    const response = await bikeService.getBikeByIdForAll(id);
    if(response.status === 200){
      return response.data;
    }
  } catch (error) {
    console.error("Error fetching bike details:", error);
  }
}
export function useGetBikeByIDAllQuery(id: string) {
  return useQuery({
    queryKey: ["bikes", "detail", id],
    queryFn: () => fetchDetailBikeByID(id),
  });
}
