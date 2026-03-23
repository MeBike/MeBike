import { colors } from "@theme/colors";
import { spacing } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";

import type { Rental } from "@/types/rental-types";

import BookingCard from "./booking-card";
import BookingHistoryHeader from "./booking-history-header";
import EmptyBookingState from "./empty-booking-state";

type BookingHistoryListProps = {
  bookings: Rental[];
  stationNameById: Map<string, string>;
  refreshing: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  onSelectBooking: (bookingId: string) => void;
};

function BookingHistoryList({
  bookings,
  stationNameById,
  refreshing,
  onRefresh,
  onLoadMore,
  isLoadingMore,
  onSelectBooking,
}: BookingHistoryListProps) {
  const footer = isLoadingMore
    ? (
        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl }}>
          <ActivityIndicator size="small" color={colors.brandPrimary} />
          <AppText marginTop="$2" tone="muted" variant="bodySmall">
            Đang tải thêm...
          </AppText>
        </View>
      )
    : null;

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={bookings}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <BookingCard
            booking={item}
            stationNameById={stationNameById}
            onPress={onSelectBooking}
          />
        </View>
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={{
        flexGrow: bookings.length === 0 ? 1 : undefined,
        paddingBottom: spacing.xxxxl,
      }}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.brandPrimary]}
          tintColor={colors.brandPrimary}
        />
      )}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
      ListHeaderComponent={<BookingHistoryHeader />}
      ListHeaderComponentStyle={{ marginBottom: -spacing.xxl }}
      ListFooterComponent={footer}
      ListEmptyComponent={<EmptyBookingState />}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default BookingHistoryList;
