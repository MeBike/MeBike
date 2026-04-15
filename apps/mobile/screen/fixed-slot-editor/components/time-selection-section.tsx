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
            <XStack alignItems="center" gap="$3" justifyContent="space-between">
              <XStack alignItems="center" flex={1} gap="$3">
                <IconSymbol color={theme.actionPrimary.val} name="clock" size="input" />
                <YStack flex={1}>
                  <AppText variant="bodyStrong">{slotStart}</AppText>
                </YStack>
              </XStack>
              <IconSymbol color={theme.textPrimary.val} name="clock" size="sm" />
            </XStack>
          </AppCard>
        )}
      </Pressable>
    </YStack>
  );
}
