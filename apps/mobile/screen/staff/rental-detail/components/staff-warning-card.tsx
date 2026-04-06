import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { borderWidths, elevations } from "@/theme/metrics";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";

type StaffWarningCardProps = {
  description: string;
  title: string;
};

export function StaffWarningCard({ description, title }: StaffWarningCardProps) {
  const theme = useTheme();

  return (
    <AppCard
      borderColor="$borderDanger"
      borderRadius="$5"
      borderWidth={borderWidths.subtle}
      chrome="flat"
      gap="$4"
      padding="$5"
      style={elevations.whisper}
      tone="danger"
    >
      <XStack alignItems="flex-start" gap="$4">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceDefault"
          borderRadius="$round"
          height={36}
          justifyContent="center"
          width={36}
        >
          <IconSymbol color={theme.statusDanger.val} name="warning" size="md" />
        </YStack>

        <YStack flex={1} gap="$2">
          <AppText tone="danger" variant="sectionTitle">
            {title}
          </AppText>
          <AppText tone="danger" variant="body">
            {description}
          </AppText>
        </YStack>
      </XStack>
    </AppCard>
  );
}
