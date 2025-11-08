import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
// import { toast } from "sonner";
import { useGetAllReservationQuery } from "./query/Reservation/useGetAllReservationQuery";
import { useGetReservationStatsQuery } from "./query/Reservation/useGetReservationStatsQuery";
import { useGetDetailReservationQuery } from "./query/Reservation/useGetDetailReservationQuery";
// interface ErrorResponse {
//   response?: {
//     data?: {
//       errors?: Record<string, { msg?: string }>;
//       message?: string;
//     };
//   };
// }
// interface ErrorWithMessage {
//   message: string;
// }
// const getErrorMessage = (error: unknown, defaultMessage: string): string => {
//   const axiosError = error as ErrorResponse;
//   if (axiosError?.response?.data) {
//     const { errors, message } = axiosError.response.data;
//     if (errors) {
//       const firstError = Object.values(errors)[0];
//       if (firstError?.msg) return firstError.msg;
//     }
//     if (message) return message;
//   }
//   const simpleError = error as ErrorWithMessage;
//   if (simpleError?.message) {
//     return simpleError.message;
//   }
//   return defaultMessage;
// };
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
      queryKey: ["all-reservations", page, limit],
    });
  }, [queryClient, hasToken, page, limit]);
  const fetchReservationStats = useCallback(() => {
    if (!hasToken) {
      return;
    }
    queryClient.invalidateQueries({
      queryKey: ["reservation", "stats"],
    });
  }, [queryClient, hasToken]);
  const fetchDetailReservation = useCallback(() => {
    if (!hasToken || !id) {
      return;
    } 
    queryClient.invalidateQueries({
      queryKey: ["detail-reservation", id],
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
