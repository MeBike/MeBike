import { useQueryClient } from "@tanstack/react-query";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { useTheme, YStack } from "tamagui";

import { presentRentalError } from "@/presenters/rentals/rental-error-presenter";
import { IconSymbol } from "@components/IconSymbol";
import { LoadingScreen } from "@components/LoadingScreen";
import { useCreateMyReturnSlotMutation } from "@hooks/mutations/rentals/use-create-my-return-slot-mutation";
import { useRequestBikeSwapMutation } from "@hooks/mutations/rentals/use-request-bike-swap-mutation";
import { invalidateMyRentalQueries } from "@hooks/rentals/rental-cache";
import { useMyBikeSwapPreview } from "@hooks/rentals/use-my-bike-swap-preview";
import { spaceScale } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";
import {
  getOvernightOperationsClosedMessage,
  isWithinVietnamOvernightOperationsWindow,
} from "@/utils/business-hours";

import { BikeList } from "./components/bike-list";
import { FixedSlotBanner } from "./components/fixed-slot-banner";
import { StationDetailHeader } from "./components/station-detail-header";
import { StationStats } from "./components/station-stats";
import { useStationDetail } from "./hooks/use-station-detail";

export default function StationDetailScreen() {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const returnSlotMutation = useCreateMyReturnSlotMutation();
  const bikeSwapMutation = useRequestBikeSwapMutation();
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
    currentBikeSwapStationId,
  } = useStationDetail();
  const { preview: bikeSwapPreview, setPendingPreview } = useMyBikeSwapPreview(rentalId ?? "");

  const isReturnSlotSelection = selectionMode === "rental-return-slot" && Boolean(rentalId);
  const isBikeSwapSelection = selectionMode === "rental-bike-swap" && Boolean(rentalId);
  const isCurrentReturnStation = currentReturnStationId === station?.id;
  const isCurrentBikeSwapStation = currentBikeSwapStationId === station?.id
    || (bikeSwapPreview?.status === "PENDING" && bikeSwapPreview.stationId === station?.id);

  const handleSelectReturnStation = () => {
    if (!station || !rentalId) {
      return;
    }

    if (isWithinVietnamOvernightOperationsWindow(new Date())) {
      Alert.alert("Ngoài giờ phục vụ", getOvernightOperationsClosedMessage());
      return;
    }

    returnSlotMutation.mutate(
      { rentalId, stationId: station.id },
      {
        onSuccess: async () => {
          await invalidateMyRentalQueries(queryClient);

          Alert.alert("Đã cập nhật bãi trả xe", `Bạn đã giữ chỗ trả xe tại ${station.name}.`, [
            {
              text: "Xem chi tiết thuê xe",
              onPress: () => {
                navigation.pop(2);
              },
            },
          ]);
        },
        onError: (error) => {
          Alert.alert("Không thể giữ chỗ", presentRentalError(error));
        },
      },
    );
  };

  const handleSelectBikeSwapStation = () => {
    if (!station || !rentalId) {
      return;
    }

    if (isWithinVietnamOvernightOperationsWindow(new Date())) {
      Alert.alert("Ngoài giờ phục vụ", getOvernightOperationsClosedMessage());
      return;
    }

    bikeSwapMutation.mutate(
      {
        rentalId,
        payload: { stationId: station.id },
      },
      {
        onSuccess: async (request) => {
          setPendingPreview({
            requestId: request.id,
            oldBikeId: request.oldBikeId,
            stationId: station.id,
            stationName: station.name,
          });
          await invalidateMyRentalQueries(queryClient);

          Alert.alert("Đã gửi yêu cầu đổi xe", `Yêu cầu đổi xe tại ${station.name} đang chờ xác nhận.`, [
            {
              text: "Xem chi tiết thuê xe",
              onPress: () => {
                navigation.pop(2);
              },
            },
          ]);
        },
        onError: (error) => {
          Alert.alert("Không thể yêu cầu đổi xe", presentRentalError(error));
        },
      },
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!station) {
    return (
      <Screen alignItems="center" justifyContent="center">
        <AppText tone="danger" variant="sectionTitle">
          Không tìm thấy trạm
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingBottom: spaceScale[9],
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.actionPrimary.val]}
            tintColor={theme.actionPrimary.val}
          />
        )}
      >
        <StationDetailHeader onBack={() => navigation.goBack()} station={station} />
        <View
          style={{
            marginTop: -spaceScale[6],
            paddingHorizontal: spaceScale[5],
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
                        : "Xác nhận bãi này để giữ chỗ trước cho phiên thuê đang diễn ra."}
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
                    <IconSymbol color={theme.textTertiary.val} name="info" size="sm" />
                    <AppText flex={1} tone="muted" variant="meta">
                      Giữ chỗ trước là tuỳ chọn. Nếu muốn chắc chắn có chỗ trả tại trạm này, hãy lưu lại bãi trả rồi đưa mã QR cho nhân viên khi tới nơi.
                    </AppText>
                  </YStack>
                </AppCard>
              )
            : null}
          {isBikeSwapSelection
            ? (
                <AppCard borderRadius="$5" gap="$4" padding="$5">
                  <YStack gap="$2">
                    <AppText tone="subtle" variant="eyebrow">
                      Chọn trạm đổi xe
                    </AppText>
                    <AppText variant="cardTitle">
                      {station.name}
                    </AppText>
                    <AppText tone="muted" variant="bodySmall">
                      {isCurrentBikeSwapStation
                        ? "Yêu cầu đổi xe của bạn đã được gửi tới trạm này trong phiên hiện tại."
                        : "Xác nhận trạm này để gửi yêu cầu đổi xe cho chuyến đi đang diễn ra."}
                    </AppText>
                  </YStack>

                  <AppButton
                    disabled={bikeSwapMutation.isPending || isCurrentBikeSwapStation}
                    loading={bikeSwapMutation.isPending}
                    onPress={handleSelectBikeSwapStation}
                    tone={isCurrentBikeSwapStation ? "outline" : "primary"}
                  >
                    {isCurrentBikeSwapStation ? "Đã gửi yêu cầu tại trạm này" : "Yêu cầu đổi xe tại trạm này"}
                  </AppButton>
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
    </Screen>
  );
}
