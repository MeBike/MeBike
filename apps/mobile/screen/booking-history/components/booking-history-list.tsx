import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { RentingHistory } from "../../../types/RentalTypes";
import BookingCard from "./booking-card";
import EmptyBookingState from "./empty-booking-state";

type BookingHistoryListProps = {
  bookings: RentingHistory[];
  refreshing: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  onSelectBooking: (bookingId: string) => void;
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContent: {
    flex: 1,
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});

function BookingHistoryList({
  bookings,
  refreshing,
  onRefresh,
  onLoadMore,
  isLoadingMore,
  onSelectBooking,
}: BookingHistoryListProps) {
  const footer = isLoadingMore ? (
    <View style={styles.loadingMoreContainer}>
      <ActivityIndicator size="small" color="#0066FF" />
      <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
    </View>
  ) : null;

  return (
    <FlatList
      data={bookings}
      renderItem={({ item }) => (
        <BookingCard booking={item} onPress={onSelectBooking} />
      )}
      keyExtractor={(item) => item._id}
      contentContainerStyle={[
        styles.listContent,
        bookings.length === 0 && styles.emptyContent,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0066FF"]}
          tintColor="#0066FF"
        />
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={footer}
      ListEmptyComponent={<EmptyBookingState />}
    />
  );
}

export default BookingHistoryList;
