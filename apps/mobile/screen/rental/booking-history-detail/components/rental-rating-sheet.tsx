import type { RatingReason } from "@services/ratings";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths } from "@theme/metrics";
import { AppBottomModalCard } from "@ui/patterns/app-bottom-modal-card";
import { AppButton } from "@ui/primitives/app-button";
import { AppInput } from "@ui/primitives/app-input";
import { AppText } from "@ui/primitives/app-text";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

import { RatingStarsInput } from "./rating-stars-input";

type RentalRatingSheetProps = {
  visible: boolean;
  bikeScore: number;
  stationScore: number;
  selectedReasons: string[];
  ratingComment: string;
  ratingError: string | null;
  displayReasons: RatingReason[];
  filteredReasons: RatingReason[];
  isRatingReasonsLoading: boolean;
  isSubmittingRating: boolean;
  showAllReasons: boolean;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onToggleReason: (reasonId: string) => void;
  onChangeBikeScore: (value: number) => void;
  onChangeStationScore: (value: number) => void;
  onChangeComment: (value: string) => void;
  onShowAllReasons: () => void;
};

type ReasonChipProps = {
  label: string;
  selected: boolean;
  tone: "compliment" | "issue";
  onPress: () => void;
};

function ReasonChip({ label, selected, tone, onPress }: ReasonChipProps) {
  const theme = useTheme();
  const iconColor = tone === "compliment" ? theme.textBrand.val : theme.textDanger.val;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <XStack
        alignItems="center"
        backgroundColor={selected ? tone === "compliment" ? "$surfaceAccent" : "$surfaceDanger" : "$surfaceDefault"}
        borderColor={selected ? tone === "compliment" ? "$borderFocus" : "$borderDanger" : "$borderSubtle"}
        borderRadius="$round"
        borderWidth={borderWidths.subtle}
        gap="$2"
        paddingHorizontal="$4"
        paddingVertical="$3"
      >
        {selected
          ? (
              <IconSymbol
                color={iconColor}
                name={tone === "compliment" ? "check-circle" : "warning"}
                size="caption"
              />
            )
          : null}
        <AppText tone={selected ? tone === "compliment" ? "brand" : "danger" : "muted"} variant="bodySmall">
          {label}
        </AppText>
      </XStack>
    </Pressable>
  );
}

export function RentalRatingSheet({
  visible,
  bikeScore,
  stationScore,
  selectedReasons,
  ratingComment,
  ratingError,
  displayReasons,
  filteredReasons,
  isRatingReasonsLoading,
  isSubmittingRating,
  showAllReasons,
  canSubmit,
  onClose,
  onSubmit,
  onToggleReason,
  onChangeBikeScore,
  onChangeStationScore,
  onChangeComment,
  onShowAllReasons,
}: RentalRatingSheetProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const hasBothScores = bikeScore > 0 && stationScore > 0;
  const hasMoreReasons = filteredReasons.length > displayReasons.length;

  const ratingPanels = (
    <YStack gap="$6">
      <YStack
        backgroundColor="$backgroundSubtle"
        borderColor="$borderSubtle"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        padding="$5"
      >
        <RatingStarsInput
          disabled={isSubmittingRating}
          iconName="bike"
          onChange={onChangeBikeScore}
          title="Chất lượng xe đạp"
          value={bikeScore}
        />
      </YStack>

      <YStack
        backgroundColor="$backgroundSubtle"
        borderColor="$borderSubtle"
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        padding="$5"
      >
        <RatingStarsInput
          disabled={isSubmittingRating}
          iconName="location"
          onChange={onChangeStationScore}
          title="Vị trí & bãi trả xe"
          value={stationScore}
        />
      </YStack>
    </YStack>
  );

  const ratingDetail = hasBothScores
    ? (
        <YStack gap="$4">
          <YStack borderTopColor="$borderSubtle" borderTopWidth={borderWidths.subtle} paddingTop="$5">
            <AppText variant="bodyStrong">Chi tiết đánh giá</AppText>
            <AppText tone="muted" variant="bodySmall">
              Bắt buộc chọn ít nhất một lý do phù hợp.
            </AppText>
          </YStack>

          <XStack flexWrap="wrap" gap="$2">
            {displayReasons.map(reason => (
              <ReasonChip
                key={reason.id}
                label={reason.message}
                onPress={() => onToggleReason(reason.id)}
                selected={selectedReasons.includes(reason.id)}
                tone={reason.type === "COMPLIMENT" ? "compliment" : "issue"}
              />
            ))}
          </XStack>

          {hasMoreReasons && !showAllReasons
            ? (
                <Pressable accessibilityRole="button" onPress={onShowAllReasons}>
                  <AppText tone="brand" variant="bodyStrong">Xem thêm lý do</AppText>
                </Pressable>
              )
            : null}

          <YStack gap="$2">
            <AppText variant="subhead">Ghi chú thêm</AppText>
            <AppInput
              multiline
              numberOfLines={4}
              onChangeText={onChangeComment}
              placeholder="Chia sẻ thêm về trải nghiệm của bạn (Không bắt buộc)..."
              readOnly={isSubmittingRating}
              style={{ minHeight: 96, paddingTop: 12 }}
              textAlignVertical="top"
              value={ratingComment}
            />
            <AppText tone="muted" variant="caption">
              Bạn có thể để lại ghi chú ngắn nếu muốn.
            </AppText>
          </YStack>

          {ratingError
            ? <AppText tone="danger" variant="bodySmall">{ratingError}</AppText>
            : null}
        </YStack>
      )
    : null;

  return (
    <AppBottomModalCard
      height={hasBothScores ? "88%" : undefined}
      isVisible={visible}
      onClose={onClose}
      variant="sheet"
    >
      <YStack {...(hasBothScores ? { flex: 1 } : null)}>
        <YStack paddingHorizontal="$6" paddingTop="$4">
          <YStack alignItems="center" gap="$4">
            <YStack backgroundColor="$borderSubtle" borderRadius="$round" height={6} width={48} />

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={{ position: "absolute", right: 0, top: 0 }}
            >
              <YStack
                alignItems="center"
                backgroundColor="$backgroundSubtle"
                borderRadius="$round"
                height={36}
                justifyContent="center"
                width={36}
              >
                <IconSymbol color={theme.textTertiary.val} name="close" size="sm" />
              </YStack>
            </Pressable>

            <YStack gap="$1" paddingBottom="$2">
              <AppText align="center" variant="title">Đánh giá chuyến đi</AppText>
              <AppText align="center" tone="muted" variant="bodySmall">
                Trải nghiệm thuê xe của bạn như thế nào?
              </AppText>
            </YStack>
          </YStack>
        </YStack>

        <YStack {...(hasBothScores ? { flex: 1 } : null)} position="relative">
          {hasBothScores
            ? (
                <ScrollView
                  bounces={false}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 24, paddingTop: 16 }}
                  showsVerticalScrollIndicator={false}
                >
                  <YStack gap="$6">
                    {ratingPanels}
                    {ratingDetail}
                  </YStack>
                </ScrollView>
              )
            : (
                <YStack padding="$6">
                  {ratingPanels}
                </YStack>
              )}

          {isRatingReasonsLoading
            ? (
                <YStack
                  alignItems="center"
                  backgroundColor="$surfaceDefault"
                  bottom={0}
                  justifyContent="center"
                  left={0}
                  opacity={0.86}
                  pointerEvents="auto"
                  position="absolute"
                  right={0}
                  top={0}
                >
                  <ActivityIndicator color={theme.actionPrimary.val} size="large" />
                </YStack>
              )
            : null}
        </YStack>

        <YStack
          borderTopColor="$borderSubtle"
          borderTopWidth={borderWidths.subtle}
          paddingTop="$4"
          paddingHorizontal="$4"
          paddingBottom={Math.max(insets.bottom, 16)}
        >
          <AppButton
            buttonSize="large"
            disabled={!canSubmit || isSubmittingRating || isRatingReasonsLoading}
            loading={isSubmittingRating}
            onPress={onSubmit}
            tone="primary"
          >
            Gửi đánh giá
          </AppButton>
        </YStack>
      </YStack>
    </AppBottomModalCard>
  );
}
