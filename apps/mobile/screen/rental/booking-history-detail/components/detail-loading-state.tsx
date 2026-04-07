import { ActivityIndicator } from "react-native";
import { useTheme, YStack } from "tamagui";

import { AppText } from "@ui/primitives/app-text";

export default function DetailLoadingState() {
  const theme = useTheme();

  return (
    <YStack alignItems="center" flex={1} gap="$4" justifyContent="center" padding="$6">
      <ActivityIndicator color={theme.actionPrimary.val} size="large" />
      <AppText align="center" tone="muted" variant="bodySmall">
        Đang tải chi tiết chuyến đi...
      </AppText>
    </YStack>
  );
}
