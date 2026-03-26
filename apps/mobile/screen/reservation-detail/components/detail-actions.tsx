import { IconSymbol } from "@components/IconSymbol";
import { spaceScale } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { Spinner, useTheme, XStack, YStack } from "tamagui";

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
  const theme = useTheme();

  if (!isPending) {
    return null;
  }

  return (
    <YStack
      backgroundColor="$surfaceDefault"
      borderColor="$borderSubtle"
      borderTopWidth={1}
      gap="$3"
      paddingHorizontal="$5"
      paddingTop="$5"
      paddingBottom={Math.max(bottomInset, spaceScale[4])}
    >
      <AppButton
        disabled={isCancelling || isConfirming}
        height={56}
        onPress={onCancel}
        tone="danger"
      >
        <XStack alignItems="center" gap="$3">
          {isCancelling
            ? <Spinner color="$onActionDanger" />
            : <IconSymbol color={theme.onActionDanger.val} name="xmark" size={20} />}
          <AppText tone="inverted" variant="actionLabel">
            Hủy đặt trước
          </AppText>
        </XStack>
      </AppButton>

      <AppButton disabled={isCancelling || isConfirming} height={56} onPress={onConfirm} tone="primary">
        <XStack alignItems="center" gap="$3">
          {isConfirming
            ? <Spinner color="$onActionPrimary" />
            : <IconSymbol color={theme.onActionPrimary.val} name="play.fill" size={20} />}
          <AppText tone="inverted" variant="actionLabel">
            Xác nhận & bắt đầu
          </AppText>
        </XStack>
      </AppButton>
    </YStack>
  );
}
