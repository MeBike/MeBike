import type { IconSymbolName } from "@components/IconSymbol";

import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { XStack, YStack } from "tamagui";

type DetailRowProps = {
  iconName: IconSymbolName;
  label: string;
  value: string;
  secondaryValue?: string;
  highlightValue?: boolean;
};

export function DetailRow({
  iconName,
  label,
  value,
  secondaryValue,
  highlightValue = false,
}: DetailRowProps) {
  return (
    <XStack alignItems="flex-start" gap="$4">
      <YStack paddingTop="$1">
        <IconSymbol color={colors.textMuted} name={iconName} size={20} />
      </YStack>

      <YStack flex={1} gap="$1.5">
        <AppText tone="subtle" variant="eyebrow">
          {label}
        </AppText>

        <AppText
          variant="value"
          style={{
            color: highlightValue ? colors.brandPrimary : colors.textPrimary,
          }}
        >
          {value}
        </AppText>

        {secondaryValue
          ? (
              <AppText tone="muted" variant="bodySmall">
                {secondaryValue}
              </AppText>
            )
          : null}
      </YStack>
    </XStack>
  );
}
