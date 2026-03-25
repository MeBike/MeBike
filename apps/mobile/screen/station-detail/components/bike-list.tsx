import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppButton } from "@ui/primitives/app-button";
import { AppListRow } from "@ui/primitives/app-list-row";
import { AppText } from "@ui/primitives/app-text";
import { RatingSummary } from "@ui/primitives/rating-summary";
import { StatusBadge } from "@ui/primitives/status-badge";
import { getBikeChipDisplay, getBikeStatusLabel, isBikeAvailable } from "@utils/bike";
import { ActivityIndicator } from "react-native";
import { XStack, YStack } from "tamagui";

import type { BikeSummary } from "@/contracts/server";

type BikeListProps = {
  bikes: BikeSummary[];
  onBikePress: (bike: BikeSummary) => void;
  onLoadMore: () => void;
  isFetching: boolean;
  hasMore: boolean;
  totalRecords: number;
};

function BikeListRow({
  bike,
  onPress,
  showDivider,
}: {
  bike: BikeSummary;
  onPress: (bike: BikeSummary) => void;
  showDivider: boolean;
}) {
  const chipDisplay = getBikeChipDisplay(bike);

  return (
    <AppListRow
      leading={(
        <XStack
          alignItems="center"
          backgroundColor={colors.surfaceMuted}
          borderRadius="$round"
          height={40}
          justifyContent="center"
          width={40}
        >
          <IconSymbol name="bicycle.circle.fill" size={20} color={colors.textSecondary} />
        </XStack>
      )}
      onPress={() => onPress(bike)}
      primary={(
        <AppText
          selectable
          style={{ fontSize: 18, fontVariant: ["tabular-nums"], fontWeight: "700", lineHeight: 24 }}
        >
          {chipDisplay}
        </AppText>
      )}
      secondary={(
        <RatingSummary
          averageRating={bike.rating.averageRating}
          size="compact"
          totalRatings={bike.rating.totalRatings}
        />
      )}
      showDivider={showDivider}
      trailing={(
        <XStack alignItems="center" gap="$2">
          <StatusBadge label={getBikeStatusLabel(bike.status)} tone="success" />
          <IconSymbol name="chevron.right" size={18} color={colors.borderSubtle} />
        </XStack>
      )}
    />
  );
}

export function BikeList({
  bikes,
  onBikePress,
  onLoadMore,
  isFetching,
  hasMore,
  totalRecords,
}: BikeListProps) {
  const rentableBikes = bikes.filter(bike => isBikeAvailable(bike.status));

  return (
    <YStack gap="$3">
      <AppText variant="xlTitle">
        Xe có thể thuê (
        {rentableBikes.length}
        )
      </AppText>

      {rentableBikes.length > 0
        ? (
            <YStack
              backgroundColor={colors.surface}
              borderColor={colors.borderSubtle}
              borderRadius={20}
              borderWidth={1}
              overflow="hidden"
            >
              {rentableBikes.map((bike, index) => (
                <BikeListRow
                  key={bike.id}
                  bike={bike}
                  onPress={onBikePress}
                  showDivider={index < rentableBikes.length - 1}
                />
              ))}

              {hasMore && rentableBikes.length <= totalRecords
                ? (
                    <AppButton alignSelf="flex-start" marginTop="$4" onPress={onLoadMore} tone="ghost">
                      {isFetching ? "Đang tải thêm xe" : "Tải thêm xe"}
                    </AppButton>
                  )
                : null}
            </YStack>
          )
        : (
            <YStack
              backgroundColor={colors.surface}
              borderColor={colors.borderSubtle}
              borderRadius={20}
              borderWidth={1}
              gap="$1.5"
              padding="$4"
            >
              <AppText variant="bodyStrong">Hiện chưa có xe sẵn sàng</AppText>
              <AppText tone="muted" variant="bodySmall">
                Hãy thử làm mới hoặc chọn trạm khác gần bạn.
              </AppText>
              {isFetching ? <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 4 }} /> : null}
            </YStack>
          )}
    </YStack>
  );
}
