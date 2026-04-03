import { LucideIconSymbol as IconSymbol } from "@components/lucide-icon-symbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import { useTheme, XStack, YStack } from "tamagui";

type IncidentRequestCardProps = {
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

export function IncidentRequestCard({
  disabled = false,
  loading = false,
  onPress,
}: IncidentRequestCardProps) {
  const theme = useTheme();

  return (
    <YStack backgroundColor="$surfaceDefault" padding="$4" paddingHorizontal="$5">
      <XStack alignItems="center" gap="$3" justifyContent="space-between">
        <XStack alignItems="center" flex={1} gap="$3">
          <YStack
            alignItems="center"
            backgroundColor="$surfaceDanger"
            borderRadius="$4"
            height={44}
            justifyContent="center"
            width={44}
          >
            <IconSymbol color={theme.actionDanger.val} name="lock.shield.fill" size={18} />
          </YStack>

          <YStack flex={1} gap="$1">
            <AppText variant="subhead">
              Gặp sự cố hỏng xe?
            </AppText>
            <AppText tone="muted" variant="bodySmall">
              Báo lỗi & yêu cầu hỗ trợ gấp
            </AppText>
          </YStack>
        </XStack>

        <AppButton
          backgroundColor="$surfaceDefault"
          borderColor="$borderSubtle"
          borderWidth={1}
          buttonSize="compact"
          disabled={disabled}
          loading={loading}
          onPress={onPress}
          pressStyle={{
            backgroundColor: theme.surfaceDefault.val,
            borderColor: theme.borderDefault.val,
            opacity: 1,
            scale: 0.985,
          }}
          shadowOpacity={0.05}
          shadowRadius={10}
          tone="ghost"
        >
          <AppText tone="danger" variant="bodySmall">
            Báo lỗi
          </AppText>
        </AppButton>
      </XStack>
    </YStack>
  );
}
