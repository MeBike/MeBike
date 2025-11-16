import { useAuth } from "@providers/auth-providers";
import React, { useMemo } from "react";
import { View } from "react-native";

import { ReservationHeader } from "./components/reservation-header";
import { ReservationInlineLoader, ReservationLoadingState } from "./components/reservation-loading-state";
import { useReservationNavigation } from "../../hooks/use-reservation-navigation";
import { ReservationsFilter } from "./components/reservations-filter";
import { ReservationsList } from "./components/reservations-list";
import { useReservations } from "./hooks/use-reservations";

function ReservationsScreen() {
  const { user } = useAuth();
  const hasToken = Boolean(user?._id);

  const {
    filters,
    activeFilter,
    setActiveFilter,
    reservations,
    stationMap,
    refreshing,
    onRefresh,
    isLoading,
    isFetching,
    emptyMessage,
    canLoadMore,
    loadMoreHistory,
    isLoadingMoreHistory,
  } = useReservations(hasToken);

  const { handleNavigateToDetail, canGoBack, goBack } = useReservationNavigation(stationMap);

  const listHeaderComponent = useMemo(() => (
    <View>
      <ReservationsFilter filters={filters} activeFilter={activeFilter} onChange={setActiveFilter} />
      {isFetching && !refreshing && !isLoadingMoreHistory && <ReservationInlineLoader />}
    </View>
  ), [activeFilter, filters, isFetching, isLoadingMoreHistory, refreshing, setActiveFilter]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F6FA" }}>
      <ReservationHeader canGoBack={canGoBack()} onGoBack={goBack} />

      {isLoading
        ? <ReservationLoadingState />
        : (
            <ReservationsList
              reservations={reservations}
              stationMap={stationMap}
              onReservationPress={handleNavigateToDetail}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onEndReached={canLoadMore ? loadMoreHistory : undefined}
              isLoadingMore={isLoadingMoreHistory}
              emptyMessage={emptyMessage}
              ListHeaderComponent={listHeaderComponent}
            />
          )}
    </View>
  );
}

export default ReservationsScreen;
