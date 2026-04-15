import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";
import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

type FixedSlotBannerProps = {
  onPress: () => void;
};

export function FixedSlotBanner({ onPress }: FixedSlotBannerProps) {
  const theme = useTheme();

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
        backgroundColor="$surfaceDefault"
        borderColor="$borderSubtle"
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
            backgroundColor="$surfaceAccent"
            borderRadius="$round"
            height={40}
            justifyContent="center"
            width={40}
          >
            <IconSymbol color={theme.actionPrimary.val} name="clock" size="md" />
          </XStack>
          <YStack flex={1} gap="$1">
            <AppText variant="bodyStrong">Khung giờ cố định</AppText>
            <AppText tone="muted" variant="caption">
              Lên lịch giữ xe tự động cho các ngày bạn chọn.
            </AppText>
          </YStack>
        </XStack>
        <IconSymbol color={theme.textTertiary.val} name="chevron-right" size="md" />
      </XStack>
    </Pressable>
  );
}
