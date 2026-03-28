import { Spinner, YStack } from "tamagui";

import { AppText } from "@ui/primitives/app-text";

export default function DetailLoadingState() {
  return (
    <YStack alignItems="center" flex={1} gap="$4" justifyContent="center" padding="$6">
      <Spinner color="$actionPrimary" size="large" />
      <AppText align="center" tone="muted" variant="bodySmall">
        Đang tải chi tiết chuyến đi...
      </AppText>
    </YStack>
  );
}
