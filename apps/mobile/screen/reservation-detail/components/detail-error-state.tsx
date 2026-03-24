import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { YStack } from "tamagui";

type DetailErrorStateProps = {
  onGoBack: () => void;
  title?: string;
  message?: string;
};

export function DetailErrorState({
  onGoBack,
  title = "Không tìm thấy dữ liệu",
  message = "Dữ liệu có thể đã bị xóa hoặc không còn tồn tại.",
}: DetailErrorStateProps) {
  return (
    <YStack alignItems="center" flex={1} gap="$3" justifyContent="center" padding="$7">
      <IconSymbol color={colors.error} name="exclamationmark.triangle" size={44} />
      <AppText align="center" variant="xlTitle">
        {title}
      </AppText>
      <AppText align="center" tone="muted" variant="bodySmall">
        {message}
      </AppText>
      <AppButton marginTop="$2" onPress={onGoBack} tone="primary">
        Quay lại
      </AppButton>
    </YStack>
  );
}
