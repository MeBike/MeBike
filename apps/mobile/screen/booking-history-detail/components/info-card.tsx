import type { ReactNode } from "react";

import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@components/IconSymbol";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

type InfoCardProps = {
  title: string;
  icon: string;
  children: ReactNode;
};

export default function InfoCard({ title, icon, children }: InfoCardProps) {
  const theme = useTheme();

  return (
    <AppCard borderRadius="$5" gap="$4" padding="$5">
      <XStack alignItems="center" gap="$3">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceMuted"
          borderRadius="$round"
          height={40}
          justifyContent="center"
          width={40}
        >
          <IconSymbol color={theme.actionPrimary.val} name={icon as any} size={18} />
        </YStack>
        <AppText variant="sectionTitle">{title}</AppText>
      </XStack>

      <YStack gap="$3">{children}</YStack>
    </AppCard>
  );
}
