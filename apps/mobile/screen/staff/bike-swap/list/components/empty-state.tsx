import { useTheme, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";

type EmptyStateProps = {
  description: string;
  title: string;
};

export function EmptyState({ description, title }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <AppCard alignItems="center" borderRadius={32} chrome="whisper" gap="$4" padding="$6">
      <YStack
        alignItems="center"
        backgroundColor="$surfaceAccent"
        borderRadius="$round"
        height={64}
        justifyContent="center"
        width={64}
      >
        <IconSymbol color={theme.textBrand.val} name="bike" size="chip" />
      </YStack>
      <YStack alignItems="center" gap="$2">
        <AppText align="center" variant="headline">
          {title}
        </AppText>
        <AppText align="center" tone="muted" variant="bodySmall">
          {description}
        </AppText>
      </YStack>
    </AppCard>
  );
}
