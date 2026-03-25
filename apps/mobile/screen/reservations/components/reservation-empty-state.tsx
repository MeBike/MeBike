import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { YStack } from "tamagui";

type ReservationEmptyStateProps = {
  message: string;
};

export function ReservationEmptyState({ message }: ReservationEmptyStateProps) {
  return (
    <YStack alignItems="center" flex={1} gap="$3" justifyContent="center" paddingVertical="$7">
      <IconSymbol color={colors.textMuted} name="clock" size={44} />
      <AppText align="center" tone="muted" variant="bodySmall">
        {message}
      </AppText>
    </YStack>
  );
}
