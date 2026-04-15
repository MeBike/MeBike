import { IconSymbol } from "@components/IconSymbol";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

type Props = {
  slotStart: string;
  onSelectTime: () => void;
};

export function TimeSelectionSection({ slotStart, onSelectTime }: Props) {
  const theme = useTheme();

  return (
    <YStack gap="$2">
      <AppText tone="muted" variant="eyebrow">Giờ bắt đầu</AppText>
      <Pressable onPress={onSelectTime}>
        {({ pressed }) => (
          <AppCard
            borderColor="$borderSubtle"
            borderWidth={1}
            chrome="flat"
            opacity={pressed ? 0.97 : 1}
            tone="muted"
          >
            <XStack alignItems="center" gap="$3">
              <IconSymbol color={theme.actionPrimary.val} name="clock" size="input" />
              <YStack flex={1} gap="$1">
                <AppText variant="bodyStrong">{slotStart}</AppText>
                <AppText tone="muted" variant="caption">Giờ này sẽ áp dụng cho toàn bộ ngày đã chọn.</AppText>
              </YStack>
              <IconSymbol color={theme.textTertiary.val} name="chevron-right" size="sm" />
            </XStack>
          </AppCard>
        )}
      </Pressable>
    </YStack>
  );
}
