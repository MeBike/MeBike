import { useCallback } from "react";

import type { Reservation } from "@/types/reservation-types";

import { useGetPendingReservationsQuery } from "../query/reservation/use-get-pending-reservations-query";
import { useGetReservationDetailQuery } from "../query/reservation/use-get-reservation-detail-query";
import { useGetReservationHistoryQuery } from "../query/reservation/use-get-reservation-history-query";

const EMPTY_RESERVATIONS: Reservation[] = [];

type UseReservationQueriesParams = {
  hasToken: boolean;
  userId?: string | null;
  pendingPage?: number;
  pendingLimit?: number;
  historyPage?: number;
  historyLimit?: number;
  historyVersion?: number;
  reservationId?: string;
  enableDetailQuery?: boolean;
  autoFetch?: boolean;
  ensureAuthenticated: () => boolean;
};

export function useReservationQueries({
  hasToken,
  userId,
  pendingPage = 1,
  pendingLimit = 10,
  historyPage = 1,
  historyLimit = 10,
  historyVersion = 0,
  reservationId,
  enableDetailQuery = false,
  autoFetch = true,
  ensureAuthenticated,
}: UseReservationQueriesParams) {
  const shouldFetchLists = autoFetch && hasToken;

  const {
    refetch: refetchPendingReservations,
    data: pendingReservationsResponse,
    isLoading: isPendingReservationsLoading,
    isFetching: isPendingReservationsFetching,
  } = useGetPendingReservationsQuery(pendingPage, pendingLimit, shouldFetchLists, userId);

  const {
    refetch: refetchReservationHistory,
    data: reservationHistoryResponse,
    isLoading: isReservationHistoryLoading,
    isFetching: isReservationHistoryFetching,
  } = useGetReservationHistoryQuery(historyPage, historyLimit, shouldFetchLists, historyVersion, userId);

  const {
    refetch: refetchReservationDetail,
    data: reservationDetail,
    isLoading: isReservationDetailLoading,
    isFetching: isReservationDetailFetching,
  } = useGetReservationDetailQuery(reservationId ?? "", enableDetailQuery, userId);

  const fetchPendingReservations = useCallback(async () => {
    if (!ensureAuthenticated()) {
      return;
    }
    await refetchPendingReservations();
  }, [ensureAuthenticated, refetchPendingReservations]);

  const fetchReservationHistory = useCallback(async () => {
    if (!ensureAuthenticated()) {
      return;
    }
    await refetchReservationHistory();
  }, [ensureAuthenticated, refetchReservationHistory]);

  const fetchReservationDetail = useCallback(async () => {
    if (!ensureAuthenticated() || !reservationId) {
      return;
    }
    await refetchReservationDetail();
  }, [ensureAuthenticated, refetchReservationDetail, reservationId]);

  return {
    pendingReservations: pendingReservationsResponse?.data ?? EMPTY_RESERVATIONS,
    pendingPagination: pendingReservationsResponse?.pagination,
    reservationHistory: reservationHistoryResponse?.data ?? EMPTY_RESERVATIONS,
    reservationHistoryPagination: reservationHistoryResponse?.pagination,
    reservationDetail,
    isPendingReservationsLoading,
    isPendingReservationsFetching,
    isReservationHistoryLoading,
    isReservationHistoryFetching,
    isReservationDetailLoading,
    isReservationDetailFetching,
    fetchPendingReservations,
    fetchReservationHistory,
    fetchReservationDetail,
  };
}
