import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservation.service";

const getDetailReservation = async (id: string) => {
  try {
    const response = await reservationService.getDetailReservation(id);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch reservation detail");
  }
};
export const useGetDetailReservationQuery = (id: string) => {
  return useQuery({
    queryKey: ["detail-reservation", id],
    queryFn: () => getDetailReservation(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
