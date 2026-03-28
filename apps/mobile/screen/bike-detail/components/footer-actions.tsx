import React from "react";
import { useTheme, YStack } from "tamagui";

import { borderWidths, spaceScale } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";

export function FooterActions({
  bottomInset,
  isBikeAvailable,
  isPrimaryDisabled,
  isReserveDisabled,
  isBookingNow,
  onBookNow,
  onReserve,
}: {
  bottomInset: number;
  isBikeAvailable: boolean;
  isPrimaryDisabled: boolean;
  isReserveDisabled: boolean;
  isBookingNow: boolean;
  onBookNow: () => void;
  onReserve: () => void;
}) {
  const theme = useTheme();

  return (
    <YStack
      backgroundColor="$surfaceDefault"
      borderTopColor="$borderSubtle"
      borderTopWidth={borderWidths.subtle}
      bottom={0}
      left={0}
      paddingBottom={bottomInset + spaceScale[4]}
      paddingHorizontal="$5"
      paddingTop="$4"
      position="absolute"
      right={0}
      shadowColor={theme.shadowColor.val}
      shadowOffset={{ width: 0, height: -10 }}
      shadowOpacity={0.06}
      shadowRadius={18}
      elevation={8}
    >
      <YStack gap="$3">
        {!isBikeAvailable
          ? (
              <AppText align="center" tone="muted" variant="bodySmall">
                Xe hiện không khả dụng. Vui lòng chọn xe khác hoặc thử lại sau.
              </AppText>
            )
          : null}

        <YStack flexDirection="row" gap="$3">
          <AppButton
            disabled={isReserveDisabled}
            flex={1}
            height={56}
            tone="outline"
            onPress={onReserve}
          >
            Đặt trước
          </AppButton>

          <AppButton
            disabled={isPrimaryDisabled}
            flex={2}
            height={56}
            loading={isBookingNow}
            tone="primary"
            onPress={onBookNow}
          >
            Thuê ngay
          </AppButton>
        </YStack>
      </YStack>
    </YStack>
  );
}
