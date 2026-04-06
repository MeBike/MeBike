import { IconSymbol } from "@components/IconSymbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { useTheme, YStack } from "tamagui";

type DetailErrorStateProps = {
  onRetry: () => void;
};

export default function DetailErrorState({ onRetry }: DetailErrorStateProps) {
  const theme = useTheme();

  return (
    <YStack flex={1} justifyContent="center" padding="$5">
      <AppCard alignItems="center" borderRadius="$5" gap="$4" padding="$6">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceAccent"
          borderRadius="$round"
          height={64}
          justifyContent="center"
          width={64}
        >
          <IconSymbol color={theme.actionPrimary.val} name="exclamationmark.triangle" size={28} />
        </YStack>
        <YStack alignItems="center" gap="$2">
          <AppText align="center" variant="headline">
            Không thể tải chi tiết thuê xe
          </AppText>
          <AppText align="center" tone="muted" variant="bodySmall">
            Vui lòng thử lại sau hoặc làm mới dữ liệu từ màn hình này.
          </AppText>
        </YStack>
        <AppButton onPress={onRetry} width="100%">
          Thử lại
        </AppButton>
      </AppCard>
    </YStack>
  );
}
