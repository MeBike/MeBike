import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { XStack, YStack } from "tamagui";

type Props = {
  slotStart?: string;
  totalDates: number;
};

export function InfoHighlights({ slotStart, totalDates }: Props) {
  return (
    <XStack gap="$3">
      <AppCard chrome="flat" flex={1} size="compact" tone="muted">
        <YStack gap="$1">
          <AppText tone="muted" variant="caption">Giờ bắt đầu</AppText>
          <AppText variant="value">{slotStart ?? "--:--"}</AppText>
        </YStack>
      </AppCard>
      <AppCard chrome="flat" flex={1} size="compact" tone="muted">
        <YStack gap="$1">
          <AppText tone="muted" variant="caption">Số ngày áp dụng</AppText>
          <AppText variant="value">{totalDates}</AppText>
        </YStack>
      </AppCard>
    </XStack>
  );
}
