import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { ActivityIndicator } from "react-native";
import { YStack } from "tamagui";

type DetailLoadingStateProps = {
  message?: string;
};

export function DetailLoadingState({
  message = "Đang tải chi tiết đặt trước...",
}: DetailLoadingStateProps) {
  return (
    <YStack alignItems="center" flex={1} gap="$3" justifyContent="center" padding="$7">
      <ActivityIndicator color={colors.brandPrimary} size="large" />
      <AppText align="center" tone="muted" variant="bodySmall">
        {message}
      </AppText>
    </YStack>
  );
}
