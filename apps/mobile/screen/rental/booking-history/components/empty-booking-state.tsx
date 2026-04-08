import { IconSymbol } from "@components/IconSymbol";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { useTheme, YStack } from "tamagui";

function EmptyBookingState() {
  const theme = useTheme();

  return (
    <YStack alignItems="center" flex={1} justifyContent="center" padding="$6">
      <AppCard alignItems="center" gap="$3" maxWidth={360} padding="$5" width="100%">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceMuted"
          borderRadius="$round"
          height={64}
          justifyContent="center"
          width={64}
        >
          <IconSymbol color={theme.textTertiary.val} name="document" size="chip" />
        </YStack>
        <AppText align="center" variant="xlTitle">
          Chưa có lịch sử thuê xe
        </AppText>
        <AppText align="center" tone="muted" variant="bodySmall">
          Khi bạn thuê xe, lịch sử sẽ hiển thị ở đây
        </AppText>
      </AppCard>
    </YStack>
  );
}

export default EmptyBookingState;
