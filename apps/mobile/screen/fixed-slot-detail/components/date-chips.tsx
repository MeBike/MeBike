import { AppText } from "@ui/primitives/app-text";
import { XStack } from "tamagui";

import { formatDisplayDate } from "../utils";

type Props = {
  dates: string[];
};

export function DateChips({ dates }: Props) {
  if (dates.length === 0)
    return null;

  return (
    <XStack flexWrap="wrap" gap="$2">
      {dates.map(date => (
        <XStack
          key={date}
          alignItems="center"
          backgroundColor="$surfaceAccent"
          borderRadius="$round"
          paddingHorizontal="$3"
          paddingVertical="$2"
        >
          <AppText variant="bodySmall">{formatDisplayDate(date)}</AppText>
        </XStack>
      ))}
    </XStack>
  );
}
