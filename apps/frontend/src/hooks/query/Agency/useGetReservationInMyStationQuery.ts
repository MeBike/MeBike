import { useQuery } from "@tanstack/react-query";
import { agencyService } from "@/services/agency.service";
import { HTTP_STATUS } from "@/constants";
import type { ReservationStatus } from "@/types";
const fetchMyReservation = async ({page,pageSize,reservation_status} : {page ?: number , pageSize ?: number , reservation_status ?: ReservationStatus}) => {
  try {
    const query: Record<string, number | string | undefined> = {
      page: page ?? 1,
      pageSize: pageSize ?? 5,
    };
    if(reservation_status!=="") query.status = reservation_status;
    const response = await agencyService.getReservationInMyStation(query);
    if (response.status === HTTP_STATUS.OK) {
      return response.data; 
    }
  } catch (error) {
    console.log(error);
    throw error;    
  }
};
export const useGetReservationInMyStationAgency = ({page,pageSize,reservation_status} : {page ?: number , pageSize ?: number , reservation_status ?: ReservationStatus}) => {
  return useQuery({
    queryKey: ["data","reservation-in-my-station","agency",page,pageSize,reservation_status],
    queryFn: () => fetchMyReservation({ page, pageSize,reservation_status }),
    enabled:false,
  });
};
