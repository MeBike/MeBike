import React from "react";
import { useTheme, XStack, YStack } from "tamagui";

import type { IconSymbolName } from "@components/IconSymbol";

import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";

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
      <YStack alignItems="center" paddingTop="$1" width={52}>
        <IconSymbol color={theme.textTertiary.val} name={iconName} size="md" />
      </YStack>

      <YStack flex={1} gap="$2">
        <AppText selectable tone="subtle" variant="eyebrow">
          {label}
        </AppText>

        <AppText selectable tone={highlightValue ? "brand" : "default"} variant="value">
          {value}
        </AppText>

        {secondaryValue
          ? (
              <AppText selectable tone="muted" variant="bodySmall">
                {secondaryValue}
              </AppText>
            )
          : null}
      </YStack>
    </XStack>
  );
}
