import { useGetStationListQuery } from "@hooks/query/stations/use-get-station-list-query";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Reservation } from "../../../types/reservation-types";

import { useReservationActions } from "../../../hooks/use-reservation-actions";

export type ReservationFilter = "pending" | "history";

export const RESERVATION_FILTERS: Array<{ key: ReservationFilter; label: string }> = [
  { key: "pending", label: "Đang chờ" },
  { key: "history", label: "Lịch sử" },
];

const PENDING_EMPTY_TEXT = "Bạn chưa có lượt đặt trước nào.";
const HISTORY_EMPTY_TEXT = "Chưa có lịch sử đặt trước.";

export function useReservations(hasToken: boolean) {
  const [activeFilter, setActiveFilter] = useState<ReservationFilter>("pending");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [historyReservations, setHistoryReservations] = useState<Reservation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const {
    pendingReservations,
    reservationHistory,
    reservationHistoryPagination,
    isPendingReservationsLoading,
    isReservationHistoryLoading,
    isPendingReservationsFetching,
    isReservationHistoryFetching,
    fetchPendingReservations,
    fetchReservationHistory,
  } = useReservationActions({ hasToken, historyPage, historyVersion });

  const {
    data: stations = [],
    refetch: refetchStations,
  } = useGetStationListQuery();
  const hasLoadedOnce = useRef(false);
  const fetchPendingRef = useRef(fetchPendingReservations);
  const refetchStationsRef = useRef(refetchStations);
  const fetchHistoryRef = useRef(fetchReservationHistory);

  useEffect(() => {
    fetchPendingRef.current = fetchPendingReservations;
  }, [fetchPendingReservations]);

  useEffect(() => {
    refetchStationsRef.current = refetchStations;
  }, [refetchStations]);

  useEffect(() => {
    fetchHistoryRef.current = fetchReservationHistory;
  }, [fetchReservationHistory]);

  useEffect(() => {
    if (hasToken) {
      void refetchStationsRef.current();
    }
  }, [hasToken]);

  useEffect(() => {
    if (!hasToken) {
      setHistoryReservations([]);
      return;
    }

    const nextHistory = Array.isArray(reservationHistory) ? reservationHistory : [];

    setHistoryReservations((prev) => {
      if (historyPage === 1) {
        return nextHistory;
      }

      if (nextHistory.length === 0) {
        return prev;
      }

      const seen = new Set(prev.map(reservation => reservation.id));
      const appended = nextHistory.filter(reservation => !seen.has(reservation.id));
      if (appended.length === 0) {
        return prev;
      }

      return [...prev, ...appended];
    });
  }, [hasToken, historyPage, reservationHistory]);

  const stationMap = useMemo(() => {
    const map = new Map<string, { name: string; address?: string }>();
    (stations || []).forEach((station) => {
      map.set(station.id, { name: station.name, address: station.address });
    });
    return map;
  }, [stations]);

  const resetHistory = useCallback((clear: boolean = false) => {
    setHistoryPage(1);
    setHistoryVersion(version => version + 1);
    if (clear) {
      setHistoryReservations([]);
    }
  }, []);

  const onRefresh = useCallback(() => {
    if (!hasToken || refreshing) {
      return;
    }

    setRefreshing(true);
    resetHistory();
    fetchPendingRef.current?.();
    void refetchStationsRef.current();
  }, [hasToken, refreshing, resetHistory]);

  useFocusEffect(
    useCallback(() => {
      if (!hasToken) {
        return;
      }

      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true;
        return;
      }

      resetHistory();
      fetchPendingRef.current?.();
      void refetchStationsRef.current();
    }, [hasToken, resetHistory]),
  );

  useEffect(() => {
    if (!refreshing) {
      return;
    }

    if (!isPendingReservationsFetching && !isReservationHistoryFetching) {
      setRefreshing(false);
    }
  }, [isPendingReservationsFetching, isReservationHistoryFetching, refreshing]);

  const hasMoreHistory = useMemo(() => {
    if (!reservationHistoryPagination) {
      return false;
    }
    return reservationHistoryPagination.page < reservationHistoryPagination.totalPages;
  }, [reservationHistoryPagination]);

  const loadMoreHistory = useCallback(() => {
    if (!hasToken || activeFilter !== "history" || !hasMoreHistory || isReservationHistoryFetching) {
      return;
    }
    setHistoryPage(page => page + 1);
  }, [activeFilter, hasMoreHistory, hasToken, isReservationHistoryFetching]);

  const historyLoadingMore = historyPage > 1 && isReservationHistoryFetching;

  const isLoadingCurrent = activeFilter === "pending"
    ? isPendingReservationsLoading && !refreshing
    : historyReservations.length === 0 && historyPage === 1 && isReservationHistoryLoading && !refreshing;

  const isFetchingCurrent = activeFilter === "pending"
    ? isPendingReservationsFetching
    : isReservationHistoryFetching;

  const reservations = activeFilter === "pending" ? pendingReservations : historyReservations;
  const emptyMessage = activeFilter === "pending" ? PENDING_EMPTY_TEXT : HISTORY_EMPTY_TEXT;

  return {
    filters: RESERVATION_FILTERS,
    activeFilter,
    setActiveFilter,
    reservations,
    stationMap,
    refreshing,
    onRefresh,
    isLoading: isLoadingCurrent,
    isFetching: isFetchingCurrent,
    emptyMessage,
    canLoadMore: activeFilter === "history" && hasMoreHistory,
    loadMoreHistory,
    isLoadingMoreHistory: activeFilter === "history" && historyLoadingMore,
  };
}
