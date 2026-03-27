import React from "react";
import { ActivityIndicator } from "react-native";
import { useTheme, YStack } from "tamagui";

import { AppText } from "@ui/primitives/app-text";

type DetailLoadingStateProps = {
  message?: string;
};

export function DetailLoadingState({
  message = "Đang tải chi tiết đặt trước...",
}: DetailLoadingStateProps) {
  const theme = useTheme();

  return (
    <YStack alignItems="center" flex={1} gap="$3" justifyContent="center" padding="$7">
      <ActivityIndicator color={theme.actionPrimary.val} size="large" />
      <AppText align="center" tone="muted" variant="bodySmall">
        {message}
      </AppText>
    </YStack>
  );
}
