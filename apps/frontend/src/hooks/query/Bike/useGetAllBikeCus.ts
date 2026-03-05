import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import type { BikeStatus } from "@/types";
import { QUERY_KEYS } from "@/constants/queryKey";
const getAllBikes = async (
  page?: number,
  pageSize?: number,
  stationId?: string,
  supplierId?: string,
  status?: BikeStatus
) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if(stationId) query.stationId = stationId;
    if(supplierId) query.supplierId = supplierId;
    if(status) query.status = status;
    const response = await bikeService.getAllBikes(query);
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
  pageSize,
  stationId,
  supplierId,
  status,
}: {
  page?: number;
  pageSize?: number;
  stationId?: string;
  supplierId?: string;
  status?: BikeStatus;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.BIKE.ALL(page, pageSize, status, stationId, supplierId),
    queryFn: () => getAllBikes(page, pageSize, stationId, supplierId, status),
  });
};
