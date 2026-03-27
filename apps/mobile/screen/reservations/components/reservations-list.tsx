import React from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useTheme } from "tamagui";

import { spaceScale } from "@theme/metrics";

import type { Reservation } from "../../../types/reservation-types";

import { ReservationCard } from "./reservation-card";
import { ReservationEmptyState } from "./reservation-empty-state";
import { ReservationInlineLoader } from "./reservation-loading-state";

type ReservationsListProps = {
  reservations: Reservation[];
  stationMap: Map<string, { name: string; address?: string }>;
  onReservationPress: (reservation: Reservation) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  emptyMessage: string;
  ListHeaderComponent?: React.ReactElement | null;
};

export function ReservationsList({
  reservations,
  stationMap,
  onReservationPress,
  refreshing,
  onRefresh,
  onEndReached,
  isLoadingMore,
  emptyMessage,
  ListHeaderComponent,
}: ReservationsListProps) {
  const theme = useTheme();

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingBottom: spaceScale[9],
        flexGrow: reservations.length === 0 ? 1 : undefined,
      }}
      data={reservations}
      ItemSeparatorComponent={() => <View style={{ height: spaceScale[5] }} />}
      keyExtractor={item => item.id}
      ListEmptyComponent={(
        <View style={{ paddingHorizontal: spaceScale[5], paddingTop: spaceScale[5], flex: 1 }}>
          <ReservationEmptyState message={emptyMessage} />
        </View>
      )}
      ListFooterComponent={isLoadingMore ? <ReservationInlineLoader /> : null}
      ListHeaderComponent={ListHeaderComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={(
        <RefreshControl
          colors={[theme.actionPrimary.val]}
          onRefresh={onRefresh}
          refreshing={refreshing}
          tintColor={theme.actionPrimary.val}
        />
      )}
      renderItem={({ item }) => {
        const stationInfo = stationMap.get(item.stationId);

        return (
          <View style={{ paddingHorizontal: spaceScale[5] }}>
            <ReservationCard
              reservation={item}
              stationName={stationInfo?.name}
              onPress={() => onReservationPress(item)}
            />
          </View>
        );
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}
