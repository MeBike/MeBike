import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
// import { toast } from "sonner";
import { useGetAllReservationQuery } from "./query/Reservation/useGetAllReservationQuery";
import { useGetReservationStatsQuery } from "./query/Reservation/useGetReservationStatsQuery";
import { useGetDetailReservationQuery } from "./query/Reservation/useGetDetailReservationQuery";
import type { ReservationStatus , ReservationOption } from "@/types";
import { QUERY_KEYS } from "@/constants/queryKey";
import { useGetAllReservationForStaffQuery, useGetDetailReservationForStaffQuery } from "./query";
interface ActionProps {
  hasToken: boolean;
  page ?: number;
  pageSize ?: number;
  id ?: string;
  status ?: ReservationStatus;
  option ?: ReservationOption
}
export const useReservationActions = ({ hasToken, page, pageSize, id , status ,option}: ActionProps) => {
  const queryClient = useQueryClient();
  const { data: allReservations, refetch: refechAllReservation , isLoading : isLoadingReservations } =
    useGetAllReservationQuery({ page:page, pageSize:pageSize , status : status , option : option });
    const { data: allReservationsStaff, refetch: refetchReservationsForStaff , isLoading : isLoadingReservationsStaff } =
    useGetAllReservationForStaffQuery({ page:page, pageSize:pageSize , status : status , option : option }); 
  const { data: reservationStats , refetch : refetchReservationsStats} = useGetReservationStatsQuery();
  const { data: detailReservation, refetch: refetchDetailReservation } = useGetDetailReservationQuery(id || "");
    const { data: detailReservationForStaff, refetch: refetchDetailReservationForStaff } = useGetDetailReservationForStaffQuery(id || "");
  const fetchAllReservations = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refechAllReservation();
  }, [queryClient, hasToken, page, pageSize , status , option]);
    const fetchAllReservationsForStaff = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchReservationsForStaff();
  }, [queryClient, hasToken, page, pageSize , status , option,refetchReservationsForStaff]);
  const fetchReservationStats = useCallback(() => {
    if (!hasToken) {
      return;
    }
    refetchReservationsStats();
  }, [queryClient, hasToken]);
  const fetchDetailReservation = useCallback(() => {
    if (!hasToken || !id) {
      return;
    } 
    refetchDetailReservation()
  }, [queryClient, hasToken, id,refetchDetailReservation()]);
  const fetchDetailReservationForStaff = useCallback(() => {
    if (!hasToken || !id) {
      return;
    } 
    refetchDetailReservationForStaff()
  }, [queryClient, hasToken, id,refetchDetailReservationForStaff()]);
  return {
    allReservations,
    fetchAllReservations,
    refechAllReservation,
    reservationStats,
    fetchReservationStats,
    refetchReservationsStats,
    fetchDetailReservation,
    detailReservation,
    refetchDetailReservation,
    isLoadingReservations,
    fetchAllReservationsForStaff,
    allReservationsStaff,
    isLoadingReservationsStaff,
    detailReservationForStaff,
    fetchDetailReservationForStaff,
  };
};
