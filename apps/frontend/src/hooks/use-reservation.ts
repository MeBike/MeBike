import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
// import { toast } from "sonner";
import { useGetAllReservationQuery } from "./query/Reservation/useGetAllReservationQuery";
import { useGetReservationStatsQuery } from "./query/Reservation/useGetReservationStatsQuery";
import { useGetDetailReservationQuery } from "./query/Reservation/useGetDetailReservationQuery";
import { QUERY_KEYS } from "@/constants/queryKey";
interface ActionProps {
  hasToken: boolean;
  page?: number;
  limit?: number;
  id?: string;
}
export const useReservationActions = ({ hasToken, page, limit, id }: ActionProps) => {
  const queryClient = useQueryClient();
  const { data: allReservations, refetch: isRefetchingAllReservation } =
    useGetAllReservationQuery({ page, limit });
  const { data: reservationStats , refetch : isRefetchingReservationStats} = useGetReservationStatsQuery();
  const { data: detailReservation, refetch: isRefetchingDetailReservation } = useGetDetailReservationQuery(id || "");
  const fetchAllReservations = useCallback(() => {
    if (!hasToken) {
      return;
    }
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.RESERVATION.ALL_RESERVATIONS(page, limit),
    });
  }, [queryClient, hasToken, page, limit]);
  const fetchReservationStats = useCallback(() => {
    if (!hasToken) {
      return;
    }
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.RESERVATION.RESERVATION_STATS,
    });
  }, [queryClient, hasToken]);
  const fetchDetailReservation = useCallback(() => {
    if (!hasToken || !id) {
      return;
    } 
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.RESERVATION.DETAIL_RESERVATION(id),
    });
  }, [queryClient, hasToken, id]);
  return {
    allReservations,
    fetchAllReservations,
    isRefetchingAllReservation,
    reservationStats,
    fetchReservationStats,
    isRefetchingReservationStats,
    fetchDetailReservation,
    detailReservation,
    isRefetchingDetailReservation,
  };
};
