import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { useTheme, YStack } from "tamagui";

type ReservationEmptyStateProps = {
  message: string;
};

export function ReservationEmptyState({ message }: ReservationEmptyStateProps) {
  const theme = useTheme();

  return (
    <YStack alignItems="center" flex={1} gap="$3" justifyContent="center" paddingVertical="$7">
      <IconSymbol color={theme.textTertiary.val} name="clock" size="hero" />
      <AppText align="center" tone="muted" variant="bodySmall">
        {message}
      </AppText>
    </YStack>
  );
}
