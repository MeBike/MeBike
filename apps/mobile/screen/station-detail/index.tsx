import { IconSymbol } from "@components/IconSymbol";
import { LoadingScreen } from "@components/LoadingScreen";
import { useCreateMyReturnSlotMutation } from "@hooks/mutations/rentals/use-create-my-return-slot-mutation";
import { rentalErrorMessage } from "@services/rentals";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "@theme/colors";
import { spacing } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { YStack } from "tamagui";

import { BikeList } from "./components/bike-list";
import { FixedSlotBanner } from "./components/fixed-slot-banner";
import { StationDetailHeader } from "./components/station-detail-header";
import { StationStats } from "./components/station-stats";
import { useStationDetail } from "./hooks/use-station-detail";

export default function StationDetailScreen() {
  const queryClient = useQueryClient();
  const returnSlotMutation = useCreateMyReturnSlotMutation();
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
    selectionMode,
    rentalId,
    currentReturnStationId,
  } = useStationDetail();

  const isReturnSlotSelection = selectionMode === "rental-return-slot" && Boolean(rentalId);
  const isCurrentReturnStation = currentReturnStationId === station?.id;

  const handleSelectReturnStation = () => {
    if (!station || !rentalId) {
      return;
    }

    returnSlotMutation.mutate(
      { rentalId, stationId: station.id },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["rentals", "me"] }),
            queryClient.invalidateQueries({ queryKey: ["rentals", "me", "detail", rentalId] }),
            queryClient.invalidateQueries({ queryKey: ["rentals", "me", "resolved-detail", rentalId] }),
            queryClient.invalidateQueries({ queryKey: ["rentals", "me", "history"] }),
            queryClient.invalidateQueries({ queryKey: ["rentals", "me", "counts"] }),
          ]);

          Alert.alert("Đã cập nhật bãi trả xe", `Bạn đã giữ chỗ trả xe tại ${station.name}.`, [
            {
              text: "Xem chi tiết thuê xe",
              onPress: () => {
                (navigation as any).pop(2);
              },
            },
          ]);
        },
        onError: (error) => {
          Alert.alert("Không thể giữ chỗ", rentalErrorMessage(error));
        },
      },
    );
  };

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
          {isReturnSlotSelection
            ? (
                <AppCard borderRadius="$5" gap="$4" padding="$5">
                  <YStack gap="$2">
                    <AppText tone="subtle" variant="eyebrow">
                      Chọn bãi trả xe
                    </AppText>
                    <AppText variant="cardTitle">
                      {station.name}
                    </AppText>
                    <AppText tone="muted" variant="bodySmall">
                      {isCurrentReturnStation
                        ? "Đây đang là bãi trả xe đã giữ chỗ cho phiên thuê của bạn."
                        : "Xác nhận bãi này để cập nhật điểm trả xe cho phiên thuê đang diễn ra."}
                    </AppText>
                  </YStack>

                  <AppButton
                    disabled={returnSlotMutation.isPending || isCurrentReturnStation}
                    loading={returnSlotMutation.isPending}
                    onPress={handleSelectReturnStation}
                    tone={isCurrentReturnStation ? "outline" : "primary"}
                  >
                    {isCurrentReturnStation ? "Đang là bãi trả hiện tại" : "Chọn bãi này để trả xe"}
                  </AppButton>

                  <YStack alignItems="center" flexDirection="row" gap="$2">
                    <IconSymbol color={colors.textMuted} name="info.circle" size={16} />
                    <AppText flex={1} tone="muted" variant="meta">
                      Sau khi giữ chỗ, quay lại chi tiết thuê xe để mở mã QR trả xe cho nhân viên.
                    </AppText>
                  </YStack>
                </AppCard>
              )
            : null}
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
