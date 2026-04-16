import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { EnvironmentImpactHistoryItem } from "@/contracts/server";

import {
  formatCo2Saved,
  getEnvironmentHistorySubtitle,
  getEnvironmentHistoryTitle,
} from "../helpers/formatters";

type EnvironmentHistoryItemRowProps = {
  item: EnvironmentImpactHistoryItem;
  onPress: (rentalId: string) => void;
};

export function EnvironmentHistoryItemRow({
  item,
  onPress,
}: EnvironmentHistoryItemRowProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={() => onPress(item.rental_id)} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
      <XStack alignItems="center" gap="$3" paddingHorizontal="$4" paddingVertical="$3">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceSuccess"
          borderRadius="$round"
          borderWidth={1}
          borderColor="$borderSubtle"
          height={48}
          justifyContent="center"
          width={48}
        >
          <IconSymbol color={theme.statusSuccess.val} name="leaf" size="sm" />
        </YStack>

        <YStack flex={1} gap="$1" minWidth={0}>
          <AppText numberOfLines={1} variant="cardTitle">
            {getEnvironmentHistoryTitle(item)}
          </AppText>
          <AppText numberOfLines={1} tone="muted" variant="bodySmall">
            {getEnvironmentHistorySubtitle(item)}
          </AppText>
        </YStack>

        <YStack alignItems="flex-end" gap="$1">
          <AppText tone="success" variant="sectionTitle">
            +
            {formatCo2Saved(item.co2_saved)}
          </AppText>
          <AppText tone="subtle" variant="bodySmall">
            {item.co2_saved_unit}
          </AppText>
        </YStack>
      </XStack>
    </Pressable>
  );
}
