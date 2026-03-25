import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";
import { Pressable } from "react-native";
import { XStack, YStack } from "tamagui";

type FixedSlotBannerProps = {
  onPress: () => void;
};

export function FixedSlotBanner({ onPress }: FixedSlotBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 20,
        opacity: pressed ? 0.96 : 1,
      })}
    >
      <XStack
        alignItems="center"
        backgroundColor={colors.surface}
        borderColor={colors.borderSubtle}
        borderRadius={20}
        borderWidth={1}
        gap="$3"
        justifyContent="space-between"
        paddingHorizontal="$4"
        paddingVertical="$4"
      >
        <XStack alignItems="center" flex={1} gap="$3">
          <XStack
            alignItems="center"
            backgroundColor={colors.surfaceAccent}
            borderRadius="$round"
            height={40}
            justifyContent="center"
            width={40}
          >
            <IconSymbol name="clock.fill" size={20} color={colors.brandPrimary} />
          </XStack>
          <YStack flex={1} gap="$1">
            <AppText variant="bodyStrong">Khung giờ cố định</AppText>
            <AppText tone="muted" variant="caption">
              Tạo lịch giữ xe nhanh hơn tại trạm này.
            </AppText>
          </YStack>
        </XStack>
        <IconSymbol name="chevron.right" size={20} color={colors.textMuted} />
      </XStack>
    </Pressable>
  );
}
