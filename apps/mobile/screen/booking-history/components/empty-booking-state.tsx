import { YStack } from "tamagui";

import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

function EmptyBookingState() {
  return (
    <YStack alignItems="center" flex={1} justifyContent="center" padding="$6">
      <AppCard alignItems="center" gap="$3" maxWidth={360} padding="$5" width="100%">
        <YStack
          alignItems="center"
          backgroundColor={colors.surfaceMuted}
          borderRadius="$round"
          height={64}
          justifyContent="center"
          width={64}
        >
          <IconSymbol color={colors.textMuted} name="doc.text" size={28} />
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
