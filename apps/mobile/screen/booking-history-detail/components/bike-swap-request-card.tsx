import { LucideIconSymbol as IconSymbol } from "@components/lucide-icon-symbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import { Spinner, useTheme, XStack, YStack } from "tamagui";

type BikeSwapPreviewStatus = "NONE" | "PENDING" | "CONFIRMED";

type BikeSwapRequestCardProps = {
  status?: BikeSwapPreviewStatus;
  onPress: () => void;
  disabled?: boolean;
  confirmedBikeLabel?: string;
};

export function BikeSwapRequestCard({
  status = "NONE",
  onPress,
  disabled = false,
  confirmedBikeLabel,
}: BikeSwapRequestCardProps) {
  const theme = useTheme();

  const isPending = status === "PENDING";
  const isConfirmed = status === "CONFIRMED";

  return (
    <YStack backgroundColor="$surfaceDefault" padding="$4" paddingHorizontal="$5">
      <XStack alignItems="center" gap="$3" justifyContent="space-between">
        <XStack alignItems="center" flex={1} gap="$3">
          <YStack
            alignItems="center"
            backgroundColor={isPending ? "$surfaceWarning" : isConfirmed ? "$surfaceSuccess" : "$surfaceAccent"}
            borderRadius="$4"
            height={44}
            justifyContent="center"
            width={44}
          >
            {isPending
              ? <Spinner color="$textWarning" />
              : isConfirmed
                ? (
                    <IconSymbol
                      color={theme.statusSuccess.val}
                      name="checkmark.circle.fill"
                      size={18}
                    />
                  )
                : (
                    <IconSymbol
                      color={theme.actionPrimary.val}
                      name="wrench.and.screwdriver.fill"
                      size={18}
                    />
                  )}
          </YStack>

          <YStack flex={1} gap="$1">
            <AppText tone={isPending ? "warning" : isConfirmed ? "success" : "default"} variant="subhead">
              {isPending
                ? "Đang xử lý yêu cầu đổi xe"
                : isConfirmed
                  ? "Đã đổi xe"
                  : "Gặp sự cố xe?"}
            </AppText>
            <AppText tone={isPending ? "warning" : isConfirmed ? "success" : "muted"} variant="bodySmall">
              {isPending
                ? "Đang chờ xác nhận"
                : isConfirmed
                  ? (confirmedBikeLabel ?? "Xe mới đã được cập nhật")
                  : "Yêu cầu đổi xe khác"}
            </AppText>
          </YStack>
        </XStack>

        {isPending
          ? null
          : (
              <AppButton
                backgroundColor="$surfaceDefault"
                borderColor="$borderSubtle"
                borderWidth={1}
                buttonSize="compact"
                disabled={disabled}
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
                <AppText tone="default" variant="bodySmall">
                  Đổi xe
                </AppText>
              </AppButton>
            )}
      </XStack>
    </YStack>
  );
}
