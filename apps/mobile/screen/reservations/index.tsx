import { useAuthNext } from "@providers/auth-provider-next";
import { colors } from "@theme/colors";
import { spacing } from "@theme/metrics";
import { Screen } from "@ui/primitives/screen";
import React, { useMemo } from "react";
import { StatusBar, View } from "react-native";
import { YStack } from "tamagui";

import { useReservationNavigation } from "../../hooks/use-reservation-navigation";
import { ReservationHeader } from "./components/reservation-header";
import { ReservationInlineLoader, ReservationLoadingState } from "./components/reservation-loading-state";
import { ReservationsList } from "./components/reservations-list";
import { useReservations } from "./hooks/use-reservations";

function ReservationsScreen() {
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
            <View style={{ paddingTop: spacing.lg }}>
              <ReservationInlineLoader />
            </View>
          )
        : null}
      <View style={{ height: spacing.xl }} />
    </YStack>
  ), [activeFilter, canGoBack, filters, goBack, isFetching, isLoadingMoreHistory, refreshing, setActiveFilter]);

  return (
    <Screen>
      <StatusBar barStyle="light-content" backgroundColor={colors.brandPrimary} />

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
