import React from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

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

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingMoreContainer: {
    paddingVertical: 16,
  },
});

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
      data={reservations}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
        const stationInfo = stationMap.get(item.station_id);
        return (
          <View style={styles.cardWrapper}>
            <ReservationCard
              reservation={item}
              stationName={stationInfo?.name}
              stationId={item.station_id}
              onPress={() => onReservationPress(item)}
            />
          </View>
        );
      }}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        isLoadingMore
          ? (
              <View style={styles.loadingMoreContainer}>
                <ReservationInlineLoader />
              </View>
            )
          : null
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ReservationEmptyState message={emptyMessage} />
        </View>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0066FF"]} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.contentContainer, reservations.length === 0 && { flex: 1 }]}
    />
  );
}
