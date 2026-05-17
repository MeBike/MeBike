import { useQuery } from "@tanstack/react-query";
import { bikeService } from "@/services/bike.service";
import type { BikeStatus } from "@/types";
import { HTTP_STATUS } from "@/constants";
const getBikeInMyStation = async (
  page?: number,
  pageSize?: number,
  stationId?: string,
  supplierId?: string,
  status?: BikeStatus,
  id?:string,
) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if(stationId) query.stationId = stationId;
    if(supplierId) query.supplierId = supplierId;
    if(status) query.status = status;
    if(id) query.id = id;
    const response = await bikeService.getBikeInMyStation(query);
    if (response.status === HTTP_STATUS.OK) {
      return response.data;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch bikes");
  }
};
export const useGetBikeInMyStationQuery = ({
  page,
  pageSize,
  stationId,
  supplierId,
  status,
  id,
}: {
  page?: number;
  pageSize?: number;
  stationId?: string;
  supplierId?: string;
  status?: BikeStatus;
  id?:string;
}) => {
  return useQuery({
    queryKey: ["data","bike-in-my-station",page,pageSize,stationId,supplierId,status,id],
    queryFn: () => getBikeInMyStation(page, pageSize, stationId, supplierId, status,id),
    enabled:false,
  });
};
