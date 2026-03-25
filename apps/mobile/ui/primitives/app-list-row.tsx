import type { ReactNode } from "react";

import { Pressable } from "react-native";
import { Separator, XStack, YStack } from "tamagui";

type AppListRowProps = {
  leading: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  dividerInset?: "$0" | "$4";
};

export function AppListRow({
  leading,
  primary,
  secondary,
  trailing,
  onPress,
  showDivider = false,
  dividerInset = "$0",
}: AppListRowProps) {
  const content = (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$4" paddingVertical="$4">
        <XStack alignItems="center" flex={1} gap="$3">
          {leading}

          <YStack flex={1} gap="$1">
            {primary}
            {secondary}
          </YStack>
        </XStack>

        {trailing
          ? (
              <XStack alignItems="center" marginLeft="$3">
                {trailing}
              </XStack>
            )
          : null}
      </XStack>

      {showDivider
        ? <Separator borderColor="$divider" marginHorizontal={dividerInset} />
        : null}
    </YStack>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.97 : 1 })}>
      {content}
    </Pressable>
  );
}
