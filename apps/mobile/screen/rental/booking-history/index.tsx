import { LoadingScreen } from "@components/LoadingScreen";
import { useGetStationListQuery } from "@hooks/query/stations/use-get-station-list-query";
import { useNavigation } from "@react-navigation/native";
import { Screen } from "@ui/primitives/screen";
import { useCallback, useMemo } from "react";
import { StatusBar } from "react-native";

import BookingHistoryList from "./components/booking-history-list";
import { useBookingHistory } from "./hooks/use-booking-history";

function BookingHistoryScreen() {
  const navigator = useNavigation();

  const {
    bookings,
    isLoading,
    refreshing,
    onRefresh,
    loadMore,
    isFetchingNextPage,
  } = useBookingHistory();
  const { data: stations = [] } = useGetStationListQuery();

  const stationNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const station of stations) {
      map.set(station.id, station.name);
    }
    return map;
  }, [stations]);

  const handleOpenBooking = useCallback(
    (bookingId: string) => {
      (navigator as any).navigate("BookingHistoryDetail", {
        bookingId,
      });
    },
    [navigator],
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Screen>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <BookingHistoryList
        bookings={bookings}
        stationNameById={stationNameById}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLoadMore={loadMore}
        isLoadingMore={isFetchingNextPage}
        onSelectBooking={handleOpenBooking}
      />
    </Screen>
  );
}

export default BookingHistoryScreen;
