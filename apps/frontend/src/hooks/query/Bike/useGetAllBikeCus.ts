import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import type { BikeStatus } from "@/types";
import { QUERY_KEYS } from "@/constants/queryKey";
const getAllBikes = async (
  page?: number,
  limit?: number,
  station_id?: string,
  supplier_id?: string,
  status?: BikeStatus
) => {
  try {
    const response = await bikeService.getAllBikes({
      page: page,
      limit: limit,
      station_id: station_id,
      supplier_id: supplier_id,
      status: status,
    });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetAllBikeQuery = ({
  page,
  limit,
  station_id,
  supplier_id,
  status,
}: {
  page?: number;
  limit?: number;
  station_id?: string;
  supplier_id?: string;
  status?: BikeStatus;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.BIKE.ALL(page, limit, status, station_id, supplier_id),
    queryFn: () => getAllBikes(page, limit, station_id, supplier_id, status),
  });
};
