import { LinearGradient } from "expo-linear-gradient";
import { Pressable } from "react-native";
import { useTheme, XStack } from "tamagui";

import { IconSymbol } from "@components/IconSymbol";
import { elevations, radii } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

type WalletTopUpCtaProps = {
  onPress: () => void;
};

export function WalletTopUpCta({ onPress }: WalletTopUpCtaProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
      <LinearGradient
        colors={[theme.statusSuccess.val, theme.textSuccess.val]}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={{
          borderRadius: radii.xxl,
          minHeight: 72,
          justifyContent: "center",
          paddingHorizontal: 24,
          ...elevations.medium,
          shadowColor: theme.statusSuccess.val,
        }}
      >
        <XStack alignItems="center" gap="$3" justifyContent="center">
          <XStack
            alignItems="center"
            borderColor="rgba(255,255,255,0.28)"
            borderRadius="$round"
            borderWidth={1}
            height={30}
            justifyContent="center"
            width={30}
          >
            <IconSymbol color={theme.onStatusSuccess.val} name="plus" size={18} />
          </XStack>
          <AppText tone="inverted" variant="headline">
            Nạp tiền
          </AppText>
        </XStack>
      </LinearGradient>
    </Pressable>
  );
}
