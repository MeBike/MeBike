import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { IconSymbolName } from "@components/IconSymbol";

import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";

type ProfileMenuOptionProps = {
  icon: IconSymbolName;
  title: string;
  subtitle?: string;
  iconColor: string;
  iconBackground: string;
  onPress: () => void;
  destructive?: boolean;
};

function ProfileMenuOption({
  icon,
  title,
  subtitle,
  iconColor,
  iconBackground,
  onPress,
  destructive = false,
}: ProfileMenuOptionProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}>
      <XStack alignItems="center" gap="$4" justifyContent="space-between" padding="$4">
        <XStack alignItems="center" flex={1} gap="$4">
          <XStack
            alignItems="center"
            backgroundColor={destructive ? theme.surfaceDanger.val : iconBackground}
            borderRadius="$3"
            height={44}
            justifyContent="center"
            width={44}
          >
            <IconSymbol color={destructive ? theme.textDanger.val : iconColor} name={icon} size={20} />
          </XStack>

          <YStack flex={1} gap="$1" minWidth={0}>
            <AppText numberOfLines={1} tone={destructive ? "danger" : "default"} variant="subhead">
              {title}
            </AppText>
            {subtitle
              ? (
                  <AppText numberOfLines={1} tone="muted" variant="bodySmall">
                    {subtitle}
                  </AppText>
                )
              : null}
          </YStack>
        </XStack>

        <IconSymbol
          color={destructive ? theme.surfaceDanger.val : theme.borderStrong.val}
          name="chevron.right"
          size={20}
        />
      </XStack>
    </Pressable>
  );
}

export default ProfileMenuOption;
