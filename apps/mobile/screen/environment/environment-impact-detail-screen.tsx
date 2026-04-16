import { IconSymbol } from "@components/IconSymbol";
import { useRoute } from "@react-navigation/native";
import { borderWidths, elevations } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { Separator, useTheme, XStack, YStack } from "tamagui";

import type { EnvironmentImpactDetailRouteProp } from "@/types/navigation";

import { presentEnvironmentError } from "@/presenters/environment/environment-error-presenter";

import { EnvironmentDetailRow } from "./components/environment-detail-row";
import { EnvironmentImpactHeroCard } from "./components/environment-impact-hero-card";
import { EnvironmentScreenState } from "./components/environment-screen-state";
import {
  formatCo2Saved,
  formatConfidence,
  formatDistanceKm,
  formatMinutes,
  getEnvironmentRentalCode,
} from "./helpers/formatters";
import { useEnvironmentImpactDetailScreen } from "./hooks/use-environment-impact-detail-screen";

export default function EnvironmentImpactDetailScreen() {
  const route = useRoute<EnvironmentImpactDetailRouteProp>();
  const theme = useTheme();
  const vm = useEnvironmentImpactDetailScreen(route.params.rentalId);

  if (vm.isInitialLoading) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        <AppHeroHeader
          onBack={vm.actions.goBack}
          size="compact"
          title="Chi tiết tác động"
          variant="surface"
        />
        <EnvironmentScreenState
          description="Đang tải công thức và các chỉ số đã dùng để tính tác động môi trường cho chuyến đi này."
          mode="loading"
          title="Đang tải chi tiết"
        />
      </Screen>
    );
  }

  if (!vm.detail) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        <AppHeroHeader
          onBack={vm.actions.goBack}
          size="compact"
          title="Chi tiết tác động"
          variant="surface"
        />
        <EnvironmentScreenState
          description={vm.error ? presentEnvironmentError(vm.error) : "Không có dữ liệu để hiển thị."}
          onRetry={() => {
            void vm.actions.onRefresh();
          }}
          title="Không thể tải chi tiết tác động"
        />
      </Screen>
    );
  }

  const detail = vm.detail;

  return (
    <Screen tone="subtle">
      <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />

      <AppHeroHeader
        onBack={vm.actions.goBack}
        size="compact"
        subtitle={`Mã chuyến: ${getEnvironmentRentalCode(detail.rental_id)}`}
        title="Chi tiết tác động"
        variant="surface"
      />

      <ScrollView
        refreshControl={(
          <RefreshControl
            colors={[theme.actionPrimary.val]}
            onRefresh={vm.actions.onRefresh}
            refreshing={vm.isRefreshing}
            tintColor={theme.actionPrimary.val}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$5" padding="$5" paddingBottom="$7">
          <EnvironmentImpactHeroCard
            eyebrow="CO2 đã tiết kiệm"
            metrics={[
              { icon: "map", label: formatDistanceKm(detail.estimated_distance_km) },
              typeof detail.effective_ride_minutes === "number"
                ? { icon: "clock", label: formatMinutes(detail.effective_ride_minutes) }
                : undefined,
            ]}
            unit={detail.co2_saved_unit}
            value={formatCo2Saved(detail.co2_saved)}
          />

          <AppCard
            borderColor="$borderSubtle"
            borderRadius="$5"
            borderWidth={borderWidths.subtle}
            chrome="flat"
            gap="$4"
            padding="$5"
            style={elevations.whisper}
          >
            <XStack alignItems="center" gap="$3">
              <YStack
                alignItems="center"
                backgroundColor="$surfaceAccent"
                borderRadius="$3"
                height={36}
                justifyContent="center"
                width={36}
              >
                <IconSymbol color={theme.actionPrimary.val} name="timer" size="sm" />
              </YStack>
              <AppText variant="sectionTitle">
                Cách chúng tôi tính toán
              </AppText>
            </XStack>

            <Separator borderColor="$backgroundSubtle" />

            <YStack>
              <EnvironmentDetailRow label="Tổng thời gian thuê" value={formatMinutes(detail.raw_rental_minutes)} />
              <Separator borderColor="$backgroundSubtle" />
              <EnvironmentDetailRow
                label="Trừ hao thời gian trả xe"
                tone="danger"
                value={typeof detail.return_scan_buffer_minutes === "number"
                  ? `-${Math.max(0, Math.round(detail.return_scan_buffer_minutes))} phút`
                  : "--"}
              />
              <Separator borderColor="$backgroundSubtle" />
              <EnvironmentDetailRow
                label="Thời gian di chuyển thực tế"
                tone="brand"
                value={formatMinutes(detail.effective_ride_minutes)}
              />
            </YStack>

            <Separator borderColor="$backgroundSubtle" />

            <YStack>
              <EnvironmentDetailRow
                label="Tốc độ trung bình ước tính"
                subValue={detail.distance_source ? `Nguồn: ${detail.distance_source}` : undefined}
                value={typeof detail.average_speed_kmh === "number"
                  ? `${detail.average_speed_kmh.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} km/h`
                  : "--"}
              />
              <Separator borderColor="$backgroundSubtle" />
              <EnvironmentDetailRow
                label="Quãng đường ước tính"
                tone="brand"
                value={formatDistanceKm(detail.estimated_distance_km)}
              />
            </YStack>

            <Separator borderColor="$backgroundSubtle" />

            <YStack>
              <EnvironmentDetailRow
                label="Hệ số CO2 tiết kiệm"
                value={typeof detail.co2_saved_per_km === "number" && detail.co2_saved_per_km_unit
                  ? `${detail.co2_saved_per_km.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ${detail.co2_saved_per_km_unit}`
                  : "--"}
              />
              <Separator borderColor="$backgroundSubtle" />
              <EnvironmentDetailRow
                label="Hệ số tin cậy"
                tone={typeof detail.confidence_factor === "number" && detail.confidence_factor >= 0.8 ? "success" : "default"}
                value={formatConfidence(detail.confidence_factor)}
              />
            </YStack>
          </AppCard>

          <AppButton onPress={vm.actions.openRentalDetail} tone="outline">
            Xem chi tiết chuyến đi
          </AppButton>
        </YStack>
      </ScrollView>
    </Screen>
  );
}
