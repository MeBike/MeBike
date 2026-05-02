import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
import type { ReservationStatus } from "@/types";
const fetchMyReservation = async ({page,pageSize,reservation_status,userId,bikeId,option} : {page ?: number , pageSize ?: number , reservation_status ?: ReservationStatus,userId ?: string ,bikeId ?: string ,option ?: string}) => {
  try {
    const query: Record<string, number | string | undefined> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if(reservation_status!=="") query.status = reservation_status;
    if(userId!=="") query.userId = userId;
    if(bikeId!=="") query.bikeId = bikeId;
    if(option!=="") query.option = option;
    const response = await agencyService.getReservationInMyStation(query);
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetReservationInMyStationAgency = ({page,pageSize,reservation_status,userId,bikeId,option} : {page ?: number , pageSize ?: number , reservation_status ?: ReservationStatus,userId ?: string ,bikeId ?: string ,option ?: string}) => {
  return useQuery({
    queryKey: ["data","reservation-in-my-station","agency",page,pageSize,reservation_status,userId,bikeId,option],
    queryFn: () => fetchMyReservation({ page, pageSize,reservation_status,userId,bikeId,option }),
    enabled:false,
  });
};
