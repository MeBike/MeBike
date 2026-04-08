import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { IconSymbolName } from "@components/IconSymbol";

import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";

type RatingStarsInputProps = {
  iconName: IconSymbolName;
  title: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function RatingStarsInput({
  iconName,
  title,
  value,
  onChange,
  disabled = false,
}: RatingStarsInputProps) {
  const theme = useTheme();

  return (
    <YStack gap="$3" paddingVertical="$1">
      <XStack alignItems="center" gap="$2" justifyContent="center">
        <IconSymbol
          color={iconName === "bike" ? theme.actionPrimary.val : theme.statusSuccess.val}
          name={iconName}
          size="sm"
        />
        <AppText variant="sectionTitle">{title}</AppText>
      </XStack>

      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$2">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isSelected = starValue <= value;

          return (
            <Pressable
              key={starValue}
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => onChange(starValue)}
              style={({ pressed }) => ({
                opacity: disabled ? 0.5 : pressed ? 0.72 : 1,
                transform: [{ scale: pressed ? 0.92 : 1 }],
                width: 56,
                height: 56,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <IconSymbol
                color={isSelected ? theme.actionAccent.val : theme.textSecondary.val}
                name="star"
                size="xl"
                variant={isSelected ? "filled" : "outline"}
              />
            </Pressable>
          );
        })}
      </XStack>
    </YStack>
  );
}
