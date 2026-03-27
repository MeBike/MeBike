import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";
import { useTheme } from "tamagui";

import type { Rental } from "@/types/rental-types";

import { spaceScale } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

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
  const theme = useTheme();
  const footer = isLoadingMore
    ? (
        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: spaceScale[5] }}>
          <ActivityIndicator size="small" color={theme.actionPrimary.val} />
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
        <View style={{ paddingHorizontal: spaceScale[5] }}>
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
        paddingBottom: spaceScale[9],
      }}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.actionPrimary.val]}
          tintColor={theme.actionPrimary.val}
        />
      )}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      ItemSeparatorComponent={() => <View style={{ height: spaceScale[4] }} />}
      ListHeaderComponent={<BookingHistoryHeader />}
      ListHeaderComponentStyle={{ marginBottom: -spaceScale[6] }}
      ListFooterComponent={footer}
      ListEmptyComponent={<EmptyBookingState />}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default BookingHistoryList;
