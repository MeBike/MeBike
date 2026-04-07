import { useTheme, XStack, YStack } from "tamagui";

import type { RatingDetail } from "@services/ratings";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

export type RentalRatingCardState
  = | { kind: "checking" }
    | { kind: "not-completed" }
    | { kind: "expired" }
    | { kind: "rated"; rating: RatingDetail | null | undefined }
    | { kind: "ready"; onPress: () => void }
    | { kind: "error"; onRetry: () => void };

type RentalRatingCardProps = {
  state: RentalRatingCardState;
};

function ScoreRow({
  iconName,
  label,
  score,
}: {
  iconName: "bike" | "location";
  label: string;
  score: number;
}) {
  const theme = useTheme();

  return (
    <XStack alignItems="center" justifyContent="space-between">
      <XStack alignItems="center" gap="$2">
        <IconSymbol
          color={iconName === "bike" ? theme.actionPrimary.val : theme.statusSuccess.val}
          name={iconName}
          size="sm"
        />
        <AppText variant="bodySmall">{label}</AppText>
      </XStack>

      <XStack alignItems="center" gap="$2">
        <XStack alignItems="center" gap="$1">
          {Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1;

            return (
              <IconSymbol
                color={starValue <= score ? theme.actionAccent.val : theme.textSecondary.val}
                key={starValue}
                name="star"
                size="caption"
                variant={starValue <= score ? "filled" : "outline"}
              />
            );
          })}
        </XStack>
        <AppText tone="muted" variant="bodySmall">
          {score}
          /5
        </AppText>
      </XStack>
    </XStack>
  );
}

export function RentalRatingCard({ state }: RentalRatingCardProps) {
  const theme = useTheme();

  if (state.kind === "not-completed") {
    return (
      <AppCard
        borderColor="$borderSubtle"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        style={elevations.whisper}
      >
        <XStack alignItems="center" gap="$4" padding="$5">
          <YStack
            alignItems="center"
            backgroundColor="$surfaceMuted"
            borderRadius="$round"
            height={48}
            justifyContent="center"
            width={48}
          >
            <IconSymbol color={theme.textTertiary.val} name="clock" size="md" />
          </YStack>

          <YStack flex={1} gap="$1">
            <AppText variant="bodyStrong">Chuyến đi đang diễn ra</AppText>
            <AppText tone="muted" variant="bodySmall">
              Bạn có thể đánh giá sau khi chuyến đi kết thúc.
            </AppText>
          </YStack>
        </XStack>
      </AppCard>
    );
  }

  if (state.kind === "checking") {
    return (
      <AppCard
        borderColor="$borderSubtle"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        padding="$5"
        style={elevations.whisper}
      >
        <AppText tone="muted" variant="bodySmall">
          Đang kiểm tra trạng thái đánh giá của chuyến đi này.
        </AppText>
      </AppCard>
    );
  }

  if (state.kind === "expired") {
    return (
      <AppCard
        borderColor="$borderSubtle"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        style={elevations.whisper}
      >
        <XStack alignItems="center" gap="$4" padding="$5">
          <YStack
            alignItems="center"
            backgroundColor="$surfaceMuted"
            borderRadius="$round"
            height={48}
            justifyContent="center"
            width={48}
          >
            <IconSymbol color={theme.textTertiary.val} name="warning" size="md" />
          </YStack>

          <YStack flex={1} gap="$1">
            <AppText variant="bodyStrong">Đã quá hạn đánh giá</AppText>
            <AppText tone="muted" variant="bodySmall">
              Chuyến đi này đã kết thúc hơn 7 ngày.
            </AppText>
          </YStack>
        </XStack>
      </AppCard>
    );
  }

  if (state.kind === "error") {
    return (
      <AppCard
        borderColor="$borderSubtle"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        padding="$5"
        style={elevations.whisper}
      >
        <YStack gap="$3">
          <AppText variant="bodyStrong">Không thể tải trạng thái đánh giá</AppText>
          <AppText tone="muted" variant="bodySmall">
            Vui lòng thử lại để kiểm tra đánh giá của chuyến đi này.
          </AppText>
          <AppButton alignSelf="flex-start" onPress={state.onRetry} tone="secondary">
            Thử lại
          </AppButton>
        </YStack>
      </AppCard>
    );
  }

  if (state.kind === "rated") {
    return (
      <AppCard
        borderColor="$successSoft"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        style={elevations.whisper}
      >
        <YStack gap="$4" padding="$5">
          <XStack alignItems="center" gap="$4">
            <YStack
              alignItems="center"
              backgroundColor="$surfaceSuccess"
              borderRadius="$round"
              height={48}
              justifyContent="center"
              width={48}
            >
              <IconSymbol color={theme.statusSuccess.val} name="check-circle" size="md" />
            </YStack>

            <YStack flex={1} gap="$1">
              <AppText tone="success" variant="bodyStrong">Đã đánh giá chuyến đi</AppText>
              <AppText tone="success" variant="bodySmall">
                Đánh giá của bạn đã được lưu cho chuyến đi này.
              </AppText>
            </YStack>
          </XStack>

          {state.rating
            ? (
                <YStack gap="$3">
                  <ScoreRow label="Chất lượng xe đạp" iconName="bike" score={state.rating.bikeScore} />
                  <ScoreRow label="Vị trí & bãi trả xe" iconName="location" score={state.rating.stationScore} />

                  {state.rating.comment
                    ? (
                        <YStack
                          backgroundColor="$backgroundSubtle"
                          borderColor="$borderSubtle"
                          borderRadius="$4"
                          borderWidth={borderWidths.subtle}
                          gap="$2"
                          padding="$4"
                        >
                          <AppText tone="muted" variant="caption">Ghi chú của bạn</AppText>
                          <AppText variant="bodySmall">{state.rating.comment}</AppText>
                        </YStack>
                      )
                    : null}
                </YStack>
              )
            : null}
        </YStack>
      </AppCard>
    );
  }

  return (
    <AppButton
      buttonSize="large"
      onPress={state.onPress}
      tone="primary"
      width="100%"
    >
      Đánh giá chuyến đi
    </AppButton>
  );
}
