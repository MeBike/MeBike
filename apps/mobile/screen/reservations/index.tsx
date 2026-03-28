import React, { useMemo } from "react";
import { StatusBar, View } from "react-native";
import { useTheme, YStack } from "tamagui";

import { useAuthNext } from "@providers/auth-provider-next";
import { spaceScale } from "@theme/metrics";
import { Screen } from "@ui/primitives/screen";

import { useReservationNavigation } from "../../hooks/use-reservation-navigation";
import { ReservationHeader } from "./components/reservation-header";
import { ReservationInlineLoader, ReservationLoadingState } from "./components/reservation-loading-state";
import { ReservationsList } from "./components/reservations-list";
import { useReservations } from "./hooks/use-reservations";

function ReservationsScreen() {
  const theme = useTheme();
  const { isAuthenticated } = useAuthNext();
  const hasToken = isAuthenticated;

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

  const { handleNavigateToDetail, canGoBack, goBack } = useReservationNavigation();

  const listHeaderComponent = useMemo(() => (
    <YStack>
      <ReservationHeader
        activeFilter={activeFilter}
        canGoBack={canGoBack()}
        filters={filters}
        onChangeFilter={setActiveFilter}
        onGoBack={goBack}
      />
      {isFetching && !refreshing && !isLoadingMoreHistory
        ? (
            <View style={{ paddingTop: spaceScale[4] }}>
              <ReservationInlineLoader />
            </View>
          )
        : null}
      <View style={{ height: spaceScale[5] }} />
    </YStack>
  ), [activeFilter, canGoBack, filters, goBack, isFetching, isLoadingMoreHistory, refreshing, setActiveFilter]);

  return (
    <Screen>
      <StatusBar barStyle="light-content" backgroundColor={theme.actionPrimary.val} />

      {isLoading
        ? (
            <YStack flex={1}>
              <ReservationHeader
                activeFilter={activeFilter}
                canGoBack={canGoBack()}
                filters={filters}
                onChangeFilter={setActiveFilter}
                onGoBack={goBack}
              />
              <ReservationLoadingState />
            </YStack>
          )
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
    </Screen>
  );
}

export default ReservationsScreen;
