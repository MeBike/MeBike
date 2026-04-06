import React from "react";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { AppText } from "@/ui/primitives/app-text";

export function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const theme = useTheme();

  return (
    <YStack alignItems="center" gap="$3" paddingHorizontal="$6" paddingTop="$10">
      <XStack alignItems="center" backgroundColor="$surfaceAccent" borderRadius="$round" height={56} justifyContent="center" width={56}>
        <IconSymbol color={theme.textBrand.val} name="phone" size="lg" variant="filled" />
      </XStack>

      <YStack gap="$1">
        <AppText align="center" variant="bodyStrong">
          {title}
        </AppText>
        <AppText align="center" tone="muted" variant="bodySmall">
          {description}
        </AppText>
      </YStack>
    </YStack>
  );
}
