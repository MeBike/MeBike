import { Separator, XStack, YStack } from "tamagui";

import { AppText } from "@ui/primitives/app-text";

type InfoRowProps = {
  label: string;
  value?: string | null;
};

export default function InfoRow({ label, value }: InfoRowProps) {
  return (
    <YStack gap="$3">
      <XStack alignItems="flex-start" justifyContent="space-between" gap="$4">
        <AppText flex={1} tone="muted" variant="subhead">
          {label}
        </AppText>
        <AppText align="right" flex={1} variant="cardTitle">
          {value && value.trim().length > 0 ? value : "--"}
        </AppText>
      </XStack>
      <Separator borderColor="$borderSubtle" />
    </YStack>
  );
}
