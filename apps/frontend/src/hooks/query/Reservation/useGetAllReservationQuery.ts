import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservation.service";

const fetchAllReservations = async () => {
  try {
    const response = await reservationService.getUserReservations();
    if(response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch reservations");
  }
};
export const useGetAllReservationQuery = () => {
  return useQuery({
    queryKey: ["all-reservations"],
    queryFn: fetchAllReservations,
    staleTime: 5 * 60 * 1000, 
  });
};