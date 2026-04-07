import type { IconSymbolName } from "@components/IconSymbol";

import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";
import React from "react";
import { useTheme, XStack, YStack } from "tamagui";

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
  const theme = useTheme();

  return (
    <XStack alignItems="flex-start" gap="$4">
      <YStack paddingTop="$1">
        <IconSymbol color={theme.textTertiary.val} name={iconName} size="md" />
      </YStack>

      <YStack flex={1} gap="$2">
        <AppText tone="subtle" variant="eyebrow">
          {label}
        </AppText>

        <AppText tone={highlightValue ? "brand" : "default"} variant="value">
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
