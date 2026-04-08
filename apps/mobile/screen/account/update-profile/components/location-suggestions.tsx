import { Pressable } from "react-native";
import { Separator, YStack } from "tamagui";

import { borderWidths } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

import type { TomTomAddressSuggestion } from "../lib/tomtom";

type LocationSuggestionsProps = {
  suggestions: TomTomAddressSuggestion[];
  onSelect: (item: TomTomAddressSuggestion) => void;
};

export function LocationSuggestions({ suggestions, onSelect }: LocationSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  const items = suggestions.slice(0, 6);

  return (
    <YStack
      backgroundColor="$surfaceDefault"
      borderColor="$borderSubtle"
      borderRadius="$3"
      borderWidth={borderWidths.subtle}
      marginTop="$2"
      overflow="hidden"
    >
      {items.map((item, index) => (
        <YStack key={`${item.address}-${index}`}>
          <Pressable onPress={() => onSelect(item)}>
            <YStack gap="$1" paddingHorizontal="$4" paddingVertical="$3">
              <AppText variant="label">{item.address}</AppText>
              <AppText tone="muted" variant="caption">
                {`${item.latitude}, ${item.longitude}`}
              </AppText>
            </YStack>
          </Pressable>
          {index === items.length - 1 ? null : <Separator borderColor="$borderSubtle" />}
        </YStack>
      ))}
    </YStack>
  );
}
