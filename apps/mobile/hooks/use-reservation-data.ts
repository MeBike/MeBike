import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Reservation } from "../types/reservation-types";

import { useReservationActions } from "./useReservationActions";
import { useStationActions } from "./useStationAction";

export type SectionData = {
  title: string;
  description: string;
  data: Reservation[];
  emptyText: string;
};

export function useReservationData(hasToken: boolean) {
  const {
    pendingReservations,
    reservationHistory,
    isPendingReservationsLoading,
    isReservationHistoryLoading,
    isPendingReservationsFetching,
    isReservationHistoryFetching,
    fetchPendingReservations,
    fetchReservationHistory,
  } = useReservationActions({ hasToken });

  const { stations, getAllStations } = useStationActions(hasToken);

  const [refreshing, setRefreshing] = useState(false);

  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (hasToken) {
      getAllStations();
    }
  }, [hasToken, getAllStations]);

  const stationMap = useMemo(() => {
    const map = new Map<string, { name: string; address?: string }>();
    (stations || []).forEach((station) => {
      map.set(station._id, { name: station.name, address: station.address });
    });
    return map;
  }, [stations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPendingReservations(),
      fetchReservationHistory(),
      getAllStations(),
    ]);
    setRefreshing(false);
  }, [fetchPendingReservations, fetchReservationHistory, getAllStations]);

  useFocusEffect(
    useCallback(() => {
      if (!hasToken) {
        return;
      }

      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true;
        return;
      }

      fetchPendingReservations();
      fetchReservationHistory();
      getAllStations();
    }, [hasToken, fetchPendingReservations, fetchReservationHistory, getAllStations]),
  );

  const isLoading = isPendingReservationsLoading || isReservationHistoryLoading;
  const isFetching = isPendingReservationsFetching || isReservationHistoryFetching;

  const sections = useMemo(
    (): SectionData[] => [
      {
        title: "Đang chờ xử lí",
        description: "Theo dõi các lượt đặt trước sắp diễn ra.",
        data: pendingReservations,
        emptyText: "Bạn chưa có lượt đặt trước nào.",
      },
      {
        title: "Lịch sử đặt trước",
        description: "Xem lại các đặt trước đã hoàn thành hoặc đã hủy.",
        data: reservationHistory,
        emptyText: "Chưa có lịch sử đặt trước.",
      },
    ],
    [pendingReservations, reservationHistory],
  );

  return {
    stationMap,
    sections,
    refreshing,
    isLoading,
    isFetching,
    onRefresh,
  };
}
