import { LoadingScreen } from "@components/LoadingScreen";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BookingHistoryHeader from "./components/booking-history-header";
import BookingHistoryList from "./components/booking-history-list";
import { useBookingHistory } from "./hooks/use-booking-history";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

function BookingHistoryScreen() {
  const navigator = useNavigation();
  const insets = useSafeAreaInsets();

  const {
    bookings,
    isLoading,
    refreshing,
    onRefresh,
    loadMore,
    isFetchingNextPage,
  } = useBookingHistory();

  const handleOpenBooking = useCallback(
    (bookingId: string) => {
      (navigator as any).navigate("BookingHistoryDetail", {
        bookingId,
      });
    },
    [navigator]
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <BookingHistoryHeader topInset={insets.top} />
      <BookingHistoryList
        bookings={bookings}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLoadMore={loadMore}
        isLoadingMore={isFetchingNextPage}
        onSelectBooking={handleOpenBooking}
      />
    </View>
  );
}

export default BookingHistoryScreen;
