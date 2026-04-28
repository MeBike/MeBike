import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations, radii, spaceScale, spacingRules } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, RefreshControl, ScrollView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Separator, useTheme, XStack, YStack } from "tamagui";

import { presentEnvironmentError } from "@/presenters/environment/environment-error-presenter";

import { EnvironmentHistoryFilterSheet } from "./components/environment-history-filter-sheet";
import { EnvironmentHistoryItemRow } from "./components/environment-history-item-row";
import { EnvironmentScreenState } from "./components/environment-screen-state";
import { EnvironmentSummaryStatCard } from "./components/environment-summary-stat-card";
import { formatCo2Saved, formatDistanceKm } from "./helpers/formatters";
import { useEnvironmentImpactScreen } from "./hooks/use-environment-impact-screen";

const environmentHeroColors = ["#0F766E", "#22C58B"] as const;
const environmentHeroCornerRadius = radii.xxl + spaceScale[2];
const environmentHeroIconShellSize = 56;
const environmentHeroCardOverlap = spaceScale[5] + spaceScale[1];

function EnvironmentOverviewHeader({
  onBack,
  title,
  co2Saved,
  unit,
}: {
  onBack: () => void;
  title: string;
  co2Saved: string;
  unit: string;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...environmentHeroColors]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{
        borderBottomLeftRadius: environmentHeroCornerRadius,
        borderBottomRightRadius: environmentHeroCornerRadius,
        paddingTop: insets.top + spacingRules.hero.paddingTop,
        paddingBottom: spaceScale[8],
      }}
    >
      <YStack gap="$5" paddingHorizontal="$5">
        <XStack alignItems="center" justifyContent="space-between" gap="$4">
          <XStack alignItems="center" flex={1} gap="$4">
            <Pressable
              onPress={onBack}
              style={{
                width: 48,
                height: 48,
                borderRadius: radii.round,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.overlayGlass.val,
              }}
            >
              <IconSymbol color={theme.onSurfaceBrand.val} name="arrow-left" size="md" />
            </Pressable>

            <AppText flex={1} numberOfLines={1} tone="inverted" variant="xlTitle">
              {title}
            </AppText>
          </XStack>

          <XStack
            alignItems="center"
            backgroundColor={theme.overlayGlass.val}
            borderRadius="$round"
            height={environmentHeroIconShellSize}
            justifyContent="center"
            marginTop={spaceScale[4]}
            width={environmentHeroIconShellSize}
          >
            <IconSymbol color={theme.onSurfaceBrand.val} name="leaf" size="lg" variant="filled" />
          </XStack>
        </XStack>

        <YStack gap="$2">
          <AppText opacity={0.88} tone="inverted" variant="eyebrow">
            Tổng CO2 tiết kiệm
          </AppText>
          <XStack alignItems="flex-end" flexWrap="wrap" gap="$2">
            <AppText selectable style={{ fontVariant: ["tabular-nums"] }} tone="inverted" variant="metricValue">
              {co2Saved}
            </AppText>
            <AppText marginBottom="$2" opacity={0.92} tone="inverted" variant="sectionTitle">
              {unit}
            </AppText>
          </XStack>
        </YStack>
      </YStack>
    </LinearGradient>
  );
}

function EnvironmentOverviewEmptyHeader({ onBack }: { onBack: () => void }) {
  return (
    <EnvironmentOverviewHeader
      co2Saved="--"
      onBack={onBack}
      title="Tác động môi trường"
      unit="gCO2e"
    />
  );
}

function EnvironmentOverviewLoadedHeader({
  onBack,
  co2Saved,
  unit,
}: {
  onBack: () => void;
  co2Saved: string;
  unit: string;
}) {
  return (
    <EnvironmentOverviewHeader
      co2Saved={co2Saved}
      onBack={onBack}
      title="Tác động môi trường"
      unit={unit}
    />
  );
}

function EnvironmentOverviewStats({
  distance,
  trips,
}: {
  distance: string;
  trips: string;
}) {
  const theme = useTheme();

  return (
    <XStack gap="$3">
      <EnvironmentSummaryStatCard
        icon="wind"
        iconBackground="$surfaceDefault"
        iconColor={theme.actionPrimary.val}
        label="Quãng đường"
        value={distance}
      />
      <EnvironmentSummaryStatCard
        icon="bike"
        iconBackground="$surfaceDefault"
        iconColor="#4F46E5"
        label="Chuyến đi"
        value={trips}
      />
    </XStack>
  );
}

export default function EnvironmentImpactScreen() {
  const theme = useTheme();
  const vm = useEnvironmentImpactScreen();
  const summaryUnit = vm.summary?.co2_saved_unit ?? "gCO2e";
  const summaryCo2Value = vm.summary
    ? formatCo2Saved(vm.summary.total_co2_saved)
    : "--";
  const summaryDistanceValue = vm.summary
    ? formatDistanceKm(vm.summary.total_estimated_distance_km)
    : "--";
  const summaryTripValue = vm.summary
    ? `${vm.summary.total_trips_counted} chuyến`
    : "--";

  if (vm.isInitialLoading) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={environmentHeroColors[0]} barStyle="light-content" />
        <EnvironmentOverviewEmptyHeader onBack={vm.actions.goBack} />
        <EnvironmentScreenState
          description="Đang tổng hợp lịch sử đóng góp và CO2 tiết kiệm của bạn."
          mode="loading"
          title="Đang tải tác động môi trường"
        />
      </Screen>
    );
  }

  if (vm.initialError && vm.historyItems.length === 0) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={environmentHeroColors[0]} barStyle="light-content" />
        <EnvironmentOverviewEmptyHeader onBack={vm.actions.goBack} />
        <EnvironmentScreenState
          description={presentEnvironmentError(vm.initialError)}
          onRetry={() => {
            void vm.actions.onRefresh();
          }}
          title="Không thể tải tác động môi trường"
        />
      </Screen>
    );
  }

  return (
    <Screen tone="subtle">
      <StatusBar backgroundColor={environmentHeroColors[0]} barStyle="light-content" />

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
        <YStack paddingBottom="$7">
          <EnvironmentOverviewLoadedHeader
            co2Saved={summaryCo2Value}
            onBack={vm.actions.goBack}
            unit={summaryUnit}
          />

          <YStack gap="$5" marginTop={-environmentHeroCardOverlap} paddingHorizontal="$5">
            <EnvironmentOverviewStats
              distance={summaryDistanceValue}
              trips={summaryTripValue}
            />

            {!vm.summary && vm.summaryError
              ? (
                  <AppCard tone="warning">
                    <AppText variant="cardTitle">
                      Không thể tải số tổng quan
                    </AppText>
                    <AppText tone="muted" variant="bodySmall">
                      {presentEnvironmentError(vm.summaryError)}
                    </AppText>
                  </AppCard>
                )
              : null}

            <AppCard
              borderColor="$borderSubtle"
              borderRadius="$5"
              borderWidth={borderWidths.subtle}
              chrome="flat"
              overflow="hidden"
              padding="$0"
              style={elevations.whisper}
            >
              <XStack alignItems="center" justifyContent="space-between" padding="$4">
                <AppText variant="sectionTitle">
                  Lịch sử đóng góp
                </AppText>
                <Pressable onPress={vm.filter.open} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
                  <XStack alignItems="center" gap="$2">
                    <AppText tone="success" variant="actionLabel">
                      {vm.filter.customRangeLabel ?? vm.activeRange.label}
                    </AppText>
                    <IconSymbol color={theme.statusSuccess.val} name="sliders" size="sm" />
                  </XStack>
                </Pressable>
              </XStack>

              <Separator borderColor="$backgroundSubtle" />

              {vm.historyItems.length === 0
                ? (
                    <YStack alignItems="center" gap="$2" padding="$6">
                      <AppText align="center" variant="cardTitle">
                        Chưa có đóng góp nào để hiển thị
                      </AppText>
                      <AppText align="center" tone="muted" variant="bodySmall">
                        Sau khi hoàn tất chuyến đi, hệ thống sẽ tự ghi nhận CO2 và quãng đường tiết kiệm tại đây.
                      </AppText>
                    </YStack>
                  )
                : (
                    <YStack>
                      {vm.historyItems.map((item, index) => (
                        <YStack key={item.id}>
                          <EnvironmentHistoryItemRow
                            item={item}
                            onPress={vm.actions.openDetail}
                          />
                          {index < vm.historyItems.length - 1
                            ? <Separator borderColor="$backgroundSubtle" />
                            : null}
                        </YStack>
                      ))}
                    </YStack>
                  )}

              {vm.history.hasNextPage
                ? (
                    <YStack padding="$4">
                      <AppButton
                        buttonSize="compact"
                        loading={vm.history.isFetchingNextPage}
                        onPress={() => {
                          vm.history.loadMore();
                        }}
                        tone="ghost"
                      >
                        Tải thêm lịch sử
                      </AppButton>
                    </YStack>
                  )
                : null}
            </AppCard>

            {vm.hasHistoryRefreshError && vm.historyRefreshError
              ? (
                  <AppCard tone="warning">
                    <AppText variant="cardTitle">
                      Không thể làm mới toàn bộ lịch sử
                    </AppText>
                    <AppText tone="muted" variant="bodySmall">
                      {presentEnvironmentError(vm.historyRefreshError)}
                    </AppText>
                  </AppCard>
                )
              : null}
          </YStack>
        </YStack>
      </ScrollView>

      <EnvironmentHistoryFilterSheet
        activeDateField={vm.filter.activeDateField}
        draftCustomRange={vm.filter.draftCustomRange}
        draftRange={vm.filter.draftRange}
        isVisible={vm.filter.isOpen}
        onApply={vm.filter.applyCustomRange}
        onChangeDate={vm.filter.changeCustomDate}
        onClose={vm.filter.close}
        onSelect={vm.filter.select}
        onSelectDateField={vm.filter.selectDateField}
        options={vm.filter.options}
      />
    </Screen>
  );
}
