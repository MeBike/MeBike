import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";

const getAllBikes = async (
  page?: number,
  limit?: number,
  station_id?: string,
  supplier_id?: string,
  status?: string
) => {
  try {
    const response = await bikeService.getAllBikes(
      page,
      limit,
      station_id,
      supplier_id,
      status
    );
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetAllBikeQuery = (
  page: number = 1,
  limit: number = 10,
  station_id?: string,
  supplier_id?: string,
  status?: string
) => {
  return useQuery({
    queryKey: ["bikes", "all", page, limit],
    queryFn: () => getAllBikes(page, limit, station_id, supplier_id, status),
  });
};
