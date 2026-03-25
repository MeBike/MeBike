import { colors } from "@theme/colors";
import { spacing } from "@theme/metrics";
import React from "react";
import { FlatList, RefreshControl, View } from "react-native";

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
  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingBottom: spacing.xxxxl,
        flexGrow: reservations.length === 0 ? 1 : undefined,
      }}
      data={reservations}
      ItemSeparatorComponent={() => <View style={{ height: spacing.xl }} />}
      keyExtractor={item => item.id}
      ListEmptyComponent={(
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, flex: 1 }}>
          <ReservationEmptyState message={emptyMessage} />
        </View>
      )}
      ListFooterComponent={isLoadingMore ? <ReservationInlineLoader /> : null}
      ListHeaderComponent={ListHeaderComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={(
        <RefreshControl
          colors={[colors.brandPrimary]}
          onRefresh={onRefresh}
          refreshing={refreshing}
          tintColor={colors.brandPrimary}
        />
      )}
      renderItem={({ item }) => {
        const stationInfo = stationMap.get(item.stationId);

        return (
          <View style={{ paddingHorizontal: spacing.xl }}>
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
