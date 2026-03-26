import React from "react";
import { ActivityIndicator } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import { AppText } from "@ui/primitives/app-text";

type LoadingStateProps = {
  message?: string;
};

export function ReservationLoadingState({ message = "Đang tải dữ liệu..." }: LoadingStateProps) {
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

export function ReservationInlineLoader() {
  const theme = useTheme();

  return (
    <XStack alignItems="center" gap="$2" justifyContent="center" paddingVertical="$2">
      <ActivityIndicator color={theme.actionPrimary.val} size="small" />
      <AppText tone="muted" variant="caption">
        Đang cập nhật...
      </AppText>
    </XStack>
  );
}
