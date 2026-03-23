import { LoadingScreen } from "@components/LoadingScreen";
import { colors } from "@theme/colors";
import { spacing } from "@theme/metrics";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { YStack } from "tamagui";

import { BikeList } from "./components/bike-list";
import { FixedSlotBanner } from "./components/fixed-slot-banner";
import { StationDetailHeader } from "./components/station-detail-header";
import { StationStats } from "./components/station-stats";
import { useStationDetail } from "./hooks/use-station-detail";

export default function StationDetailScreen() {
  const {
    station,
    isLoading,
    loadedBikes,
    isFetchingAllBikes,
    hasMore,
    totalRecords,
    refreshing,
    handleBikePress,
    handleRefresh,
    handleLoadMore,
    navigation,
  } = useStationDetail();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!station) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ fontSize: 18, color: colors.error }}>Không tìm thấy trạm</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingBottom: spacing.xxxxl,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.brandPrimary]}
            tintColor={colors.brandPrimary}
          />
        )}
      >
        <StationDetailHeader
          onBack={() => navigation.goBack()}
          station={station}
        />
        <View
          style={{
            marginTop: -spacing.xxl,
            paddingHorizontal: spacing.xl,
            zIndex: 10,
          }}
        >
          <StationStats station={station} />
        </View>
        <YStack gap="$5" padding="$5" paddingTop="$5">
          <FixedSlotBanner
            onPress={() => navigation.navigate("FixedSlotTemplates", {
              stationId: station.id,
              stationName: station.name,
            })}
          />
          <BikeList
            bikes={loadedBikes}
            onBikePress={handleBikePress}
            onLoadMore={handleLoadMore}
            isFetching={isFetchingAllBikes}
            hasMore={hasMore}
            totalRecords={totalRecords}
          />
        </YStack>
      </ScrollView>
    </View>
  );
}
