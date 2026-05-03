import { useNavigation } from "@react-navigation/native";
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { Separator, Spinner, useTheme, XStack, YStack } from "tamagui";

import type { ActiveCouponRule } from "@/contracts/server";
import type { RidingOffersNavigationProp } from "@/types/navigation";

import { useActiveCouponRulesQuery } from "@/hooks/query/coupons/use-active-coupon-rules-query";
import { formatCurrency } from "@/utils/wallet/formatters";
import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations, radii, spaceScale } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";

function formatDiscount(rule: ActiveCouponRule) {
  if (rule.discountType === "PERCENTAGE") {
    return `Giảm ${rule.discountValue}%`;
  }

  return `Giảm ${formatCurrency(rule.discountValue)}`;
}

function formatDuration(minutes: number) {
  if (minutes % 60 === 0) {
    return `${minutes / 60} giờ`;
  }

  return `${minutes} phút`;
}

function RuleCard({ nextMinRidingMinutes, rule }: { nextMinRidingMinutes?: number; rule: ActiveCouponRule }) {
  const theme = useTheme();
  const thresholdLabel = `Từ ${formatDuration(rule.minRidingMinutes)} đạp xe`;
  const upperBoundLabel = nextMinRidingMinutes
    ? `Đến dưới ${formatDuration(nextMinRidingMinutes)}`
    : null;

  return (
    <AppCard
      borderColor="$borderSubtle"
      borderRadius={radii.xl}
      borderWidth={borderWidths.subtle}
      chrome="flat"
      gap="$4"
      padding="$4"
      style={elevations.whisper}
    >
      <XStack alignItems="center" gap="$4">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceSuccess"
          borderRadius="$round"
          height={56}
          justifyContent="center"
          width={56}
        >
          <IconSymbol color={theme.statusSuccess.val} name="tag" size="lg" />
        </YStack>

        <YStack flex={1} gap="$1" minWidth={0}>
          <AppText numberOfLines={1} tone="success" variant="headline">
            {formatDiscount(rule)}
          </AppText>
          <XStack alignItems="center" gap="$2">
            <IconSymbol color={theme.statusWarning.val} name="zap" size="caption" variant="filled" />
            <AppText tone="muted" variant="bodySmall">
              Áp dụng tự động
            </AppText>
          </XStack>
        </YStack>
      </XStack>

      <Separator borderColor="$backgroundSubtle" />

      <XStack alignItems="center" gap="$3">
        <IconSymbol color={theme.textTertiary.val} name="clock" size="input" />
        <YStack flex={1} gap="$1" minWidth={0}>
          <AppText variant="subhead">
            {thresholdLabel}
          </AppText>
          {upperBoundLabel
            ? (
                <AppText tone="muted" variant="bodySmall">
                  {upperBoundLabel}
                </AppText>
              )
            : null}
        </YStack>
      </XStack>
    </AppCard>
  );
}

function LoadingState() {
  return (
    <YStack alignItems="center" gap="$3" paddingVertical="$9">
      <Spinner size="small" color="$textBrand" />
      <AppText tone="muted" variant="bodySmall">
        Đang tải ưu đãi đạp xe...
      </AppText>
    </YStack>
  );
}

function EmptyState() {
  const theme = useTheme();

  return (
    <AppCard alignItems="center" borderRadius={radii.xl} gap="$3" padding="$6">
      <IconSymbol color={theme.textTertiary.val} name="tag" size="xl" />
      <AppText align="center" variant="cardTitle">
        Chưa có ưu đãi đang áp dụng
      </AppText>
      <AppText align="center" tone="muted" variant="bodySmall">
        Các mốc giảm giá mới sẽ hiển thị tại đây khi được hệ thống kích hoạt.
      </AppText>
    </AppCard>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <AppCard alignItems="center" borderRadius={radii.xl} gap="$3" padding="$6" tone="warning">
      <AppText align="center" variant="cardTitle">
        Không thể tải ưu đãi
      </AppText>
      <AppText align="center" tone="muted" variant="bodySmall">
        Vui lòng kiểm tra kết nối và thử lại.
      </AppText>
      <AppButton buttonSize="compact" onPress={onRetry}>
        Thử lại
      </AppButton>
    </AppCard>
  );
}

export default function RidingOffersScreen() {
  const navigation = useNavigation<RidingOffersNavigationProp>();
  const theme = useTheme();
  const query = useActiveCouponRulesQuery();
  const rules = [...(query.data?.data ?? [])].sort((left, right) => left.minRidingMinutes - right.minRidingMinutes);

  return (
    <Screen tone="subtle">
      <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
      <AppHeroHeader
        onBack={() => navigation.goBack()}
        size="compact"
        subtitle="Tự động áp dụng khi chuyến đi đủ điều kiện"
        title="Ưu đãi đạp xe"
        variant="brand"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spaceScale[7] }}
        refreshControl={(
          <RefreshControl
            colors={[theme.actionPrimary.val]}
            onRefresh={() => {
              void query.refetch();
            }}
            refreshing={query.isRefetching}
            tintColor={theme.actionPrimary.val}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$5" padding="$5" paddingTop="$6">
          <YStack gap="$3">
            <AppText variant="sectionTitle">
              Các mốc đang áp dụng
            </AppText>

            {query.isLoading
              ? <LoadingState />
              : query.isError
                ? <ErrorState onRetry={() => { void query.refetch(); }} />
                : rules.length === 0
                  ? <EmptyState />
                  : rules.map((rule, index) => (
                      <RuleCard
                        key={rule.id}
                        nextMinRidingMinutes={rules[index + 1]?.minRidingMinutes}
                        rule={rule}
                      />
                    ))}
          </YStack>

        </YStack>
      </ScrollView>
    </Screen>
  );
}
