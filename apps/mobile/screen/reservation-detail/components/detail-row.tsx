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
  highlightValue = false,
}: DetailRowProps) {
  return (
    <XStack alignItems="flex-start" gap="$4">
      <YStack paddingTop="$1">
        <IconSymbol color={colors.textMuted} name={iconName} size={20} />
      </YStack>

      <YStack flex={1} gap="$1.5">
        <AppText
          tone="subtle"
          variant="caption"
          style={{
            fontSize: 13,
            fontWeight: "800",
            letterSpacing: 0.8,
            lineHeight: 18,
            textTransform: "uppercase",
          }}
        >
          {label}
        </AppText>

        <AppText
          style={{
            color: highlightValue ? colors.brandPrimary : colors.textPrimary,
            fontSize: 17,
            fontWeight: "700",
            letterSpacing: -0.2,
            lineHeight: 24,
          }}
        >
          {value}
        </AppText>

      </YStack>
    </XStack>
  );
}
