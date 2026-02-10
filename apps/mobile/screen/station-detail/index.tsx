import { LoadingScreen } from "@components/LoadingScreen";
import StationMap2D from "@components/StationMap2D";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { BikeColors } from "../../constants/BikeColors";
import { BikeList } from "./components/bike-list";
import { FixedSlotBanner } from "./components/fixed-slot-banner";
import { StationDetailHeader } from "./components/station-detail-header";
import { StationInfoCard } from "./components/station-info-card";
import { StationStats } from "./components/station-stats";
import { useStationDetail } from "./hooks/use-station-detail";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BikeColors.background,
  },
  errorText: {
    fontSize: 18,
    color: BikeColors.error,
  },
});

export default function StationDetailScreen() {
  const {
    station,
    isLoading,
    loadedBikes,
    allBikes,
    isFetchingAllBikes,
    hasMore,
    totalRecords,
    refreshing,
    focusedBike,
    handleBikePress,
    handleRefresh,
    handleLoadMore,
    navigation,
    insets,
  } = useStationDetail();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!station) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy trạm</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[BikeColors.primary]}
            tintColor={BikeColors.primary}
          />
        )}
      >
        <StationDetailHeader
          insets={insets}
          onBack={() => navigation.goBack()}
        />
        <StationInfoCard station={station} />
        <FixedSlotBanner
          _stationId={station._id}
          _stationName={station.name}
          onPress={() => navigation.navigate("FixedSlotTemplates", {
            stationId: station._id,
            stationName: station.name,
          })}
        />
        <StationStats station={station} />
        <StationMap2D
          station={station}
          bikes={allBikes}
          selectedBike={focusedBike}
          onBikePress={handleBikePress}
        />
        <BikeList
          bikes={loadedBikes}
          onBikePress={handleBikePress}
          onLoadMore={handleLoadMore}
          isFetching={isFetchingAllBikes}
          hasMore={hasMore}
          totalRecords={totalRecords}
        />
      </ScrollView>
    </View>
  );
}
