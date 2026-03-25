import { AppText } from "@ui/primitives/app-text";
import { Spinner, YStack } from "tamagui";

export default function DetailLoadingState() {
  return (
    <YStack alignItems="center" flex={1} gap="$4" justifyContent="center" padding="$6">
      <Spinner color="$brandPrimary" size="large" />
      <AppText align="center" tone="muted" variant="bodySmall">
        Đang tải chi tiết chuyến đi...
      </AppText>
    </YStack>
  );
}
