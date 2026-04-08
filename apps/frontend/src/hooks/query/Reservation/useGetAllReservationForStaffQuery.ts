import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservation.service";
import { QUERY_KEYS } from "@/constants/queryKey";
import type { ReservationOption,ReservationStatus } from "@/types";
const fetchAllReservations = async ({
  page,
  pageSize,
  status,
  option,
}: {
  page?: number;
  pageSize?: number;
  status?: ReservationStatus;
  option?: ReservationOption;
}) => {
  try {
    const query: Record<string, number | string> = {
      page: page ?? 1,
      pageSize: pageSize ?? 10,
    };
    if (status) query.status = status;
    if (option) query.option = option;
    const response = await reservationService.getUserReservationsForStaff(query);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch reservations");
  }
};
export const useGetAllReservationForStaffQuery = ({
  page,
  pageSize,
  status,
  option
}: {
  page?: number;
  pageSize?: number;
  status ?: ReservationStatus;
  option ?: ReservationOption;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.RESERVATION.ALL_RESERVATIONS(page, pageSize),
    queryFn: () => fetchAllReservations({ page: page, pageSize: pageSize , status : status , option : option }),
    staleTime: 5 * 60 * 1000,
    enabled:false,
  });
};
