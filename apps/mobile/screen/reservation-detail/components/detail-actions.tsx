import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { spacing } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { Spinner, XStack, YStack } from "tamagui";

type DetailActionsProps = {
  isPending: boolean;
  isConfirming: boolean;
  isCancelling: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  bottomInset: number;
};

export function DetailActions({
  isPending,
  isConfirming,
  isCancelling,
  onConfirm,
  onCancel,
  bottomInset,
}: DetailActionsProps) {
  if (!isPending) {
    return null;
  }

  return (
    <YStack
      backgroundColor={colors.surface}
      borderColor={colors.borderSubtle}
      borderTopWidth={1}
      gap="$3"
      paddingHorizontal="$5"
      paddingTop="$5"
      paddingBottom={Math.max(bottomInset, spacing.lg)}
    >
      <AppButton
        backgroundColor={colors.errorSoft}
        borderColor="rgba(239, 68, 68, 0.2)"
        disabled={isCancelling || isConfirming}
        elevation={0}
        height={56}
        onPress={onCancel}
        shadowOpacity={0}
        shadowRadius={0}
        tone="outline"
      >
        <XStack alignItems="center" gap="$2.5">
          {isCancelling
            ? <Spinner color={colors.error} />
            : <IconSymbol color={colors.error} name="xmark" size={20} />}
          <AppText tone="danger" variant="actionLabel">
            Hủy đặt trước
          </AppText>
        </XStack>
      </AppButton>

      <AppButton disabled={isCancelling || isConfirming} height={56} onPress={onConfirm} tone="primary">
        <XStack alignItems="center" gap="$2.5">
          {isConfirming
            ? <Spinner color={colors.textOnBrand} />
            : <IconSymbol color={colors.textOnBrand} name="play.fill" size={20} />}
          <AppText tone="inverted" variant="actionLabel">
            Xác nhận & bắt đầu
          </AppText>
        </XStack>
      </AppButton>
    </YStack>
  );
}
