import type { IconSymbolName } from "@components/IconSymbol";
import type { ReactNode } from "react";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { useTheme, XStack, YStack } from "tamagui";

type StaffSectionCardProps = {
  children: ReactNode;
  iconName: IconSymbolName;
  title: string;
};

export function StaffSectionCard({ children, iconName, title }: StaffSectionCardProps) {
  const theme = useTheme();

  return (
    <AppCard
      borderColor="$borderSubtle"
      borderRadius="$5"
      borderWidth={borderWidths.subtle}
      chrome="flat"
      gap="$4"
      padding="$5"
      style={elevations.whisper}
    >
      <XStack alignItems="center" gap="$3">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceMuted"
          borderRadius="$round"
          height={40}
          justifyContent="center"
          width={40}
        >
          <IconSymbol color={theme.textBrand.val} name={iconName} size={18} />
        </YStack>

        <AppText variant="cardTitle">{title}</AppText>
      </XStack>

      <YStack gap="$3">{children}</YStack>
    </AppCard>
  );
}
