import { useQuery } from "@tanstack/react-query";
import { reservationService } from "@services/reservation.service";
import { QUERY_KEYS } from "@/constants/queryKey";
const getDetailReservation = async (id: string) => {
  try {
    const response = await reservationService.getDetailReservationForStaff(id);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch reservation detail");
  }
};
export const useGetDetailReservationForStaffQuery = (id: string) => {
  // Lọc sạch ID rỗng, undefined, null
  const isValidId = 
    Boolean(id) && 
    id !== "undefined" && 
    id !== "null" && 
    id.trim() !== "";

  return useQuery({
    queryKey: ['STAFF_RESERVATION_DETAIL', id], // Hoặc QUERY_KEYS tương ứng của bạn
    queryFn: () => getDetailReservation(id),
    staleTime: 5 * 60 * 1000,
    // THÊM DÒNG NÀY VÀO LÀ HẾT BỆNH:
    enabled: !!id, 
  });
};