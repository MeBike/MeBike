import { LucideIconSymbol as IconSymbol } from "@components/lucide-icon-symbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import { Spinner, useTheme, XStack, YStack } from "tamagui";

type BikeSwapPreviewStatus = "NONE" | "PENDING" | "CONFIRMED" | "REJECTED";

type BikeSwapRequestCardProps = {
  status?: BikeSwapPreviewStatus;
  onPress: () => void;
  disabled?: boolean;
  confirmedBikeLabel?: string;
  rejectionReason?: string | null;
};

export function BikeSwapRequestCard({
  status = "NONE",
  onPress,
  disabled = false,
  confirmedBikeLabel,
  rejectionReason,
}: BikeSwapRequestCardProps) {
  const theme = useTheme();

  const isPending = status === "PENDING";
  const isConfirmed = status === "CONFIRMED";
  const isRejected = status === "REJECTED";

  return (
    <YStack backgroundColor="$surfaceDefault" padding="$4" paddingHorizontal="$5">
      <XStack alignItems="center" gap="$3" justifyContent="space-between">
        <XStack alignItems="center" flex={1} gap="$3">
          <YStack
            alignItems="center"
            backgroundColor={isPending
              ? "$surfaceWarning"
              : isConfirmed
                ? "$surfaceSuccess"
                : isRejected
                  ? "$surfaceDanger"
                  : "$surfaceAccent"}
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
                : isRejected
                  ? (
                      <IconSymbol
                        color={theme.actionDanger.val}
                        name="exclamationmark.triangle"
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
            <AppText tone={isPending ? "warning" : isConfirmed ? "success" : isRejected ? "danger" : "default"} variant="subhead">
              {isPending
                ? "Đang xử lý yêu cầu đổi xe"
                : isConfirmed
                  ? "Đã đổi xe"
                  : isRejected
                    ? "Yêu cầu đổi xe bị từ chối"
                    : "Gặp sự cố xe?"}
            </AppText>
            <AppText tone={isPending ? "warning" : isConfirmed ? "success" : isRejected ? "danger" : "muted"} variant="bodySmall">
              {isPending
                ? "Đang chờ xác nhận"
                : isConfirmed
                  ? (confirmedBikeLabel ?? "Xe mới đã được cập nhật")
                  : isRejected
                    ? (rejectionReason?.trim() || "Bạn có thể chọn trạm khác để gửi lại yêu cầu")
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
                <AppText tone={isRejected ? "danger" : "default"} variant="bodySmall">
                  {isRejected ? "Gửi lại" : "Đổi xe"}
                </AppText>
              </AppButton>
            )}
      </XStack>
    </YStack>
  );
}
