import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import type { BikeStatus } from "@/types";
import { QUERY_KEYS } from "@/constants/queryKey";
import { HTTP_STATUS } from "@/constants";
const getAllBikes = async (
  id ?: string,
  page?: number,
  pageSize?: number,
  stationId?: string,
  supplierId?: string,
  status?: BikeStatus,
) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if(id) query.id = id;
    if (stationId) query.stationId = stationId;
    if (supplierId) query.supplierId = supplierId;
    if (status) query.status = status;
    if (stationId) {
      query.stationId = stationId;
    }

    if (supplierId) {
      query.supplierId = supplierId;
    }
    const response = await bikeService.getAllBikes(query);
    if (response.status === HTTP_STATUS.OK) {
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
  id
}: {
  page?: number;
  pageSize?: number;
  stationId?: string;
  supplierId?: string;
  status?: BikeStatus;
  id?: string;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.BIKE.ALL(
      id,
      page,
      pageSize,
      status,
      stationId,
      supplierId
    ),
    queryFn: () => getAllBikes(id,page, pageSize, stationId, supplierId, status),
  });
};
