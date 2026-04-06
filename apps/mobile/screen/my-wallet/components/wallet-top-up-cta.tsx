import { IconSymbol } from "@components/IconSymbol";
import { elevations, radii, spaceScale } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { Pressable } from "react-native";
import { useTheme, View, XStack } from "tamagui";

type WalletTopUpCtaProps = {
  onPress: () => void;
};

const topUpCtaMinHeight = spaceScale[10];
const topUpIconShellSize = spaceScale[7] + spaceScale[1];

export function WalletTopUpCta({ onPress }: WalletTopUpCtaProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}>
      <XStack
        alignItems="center"
        backgroundColor="$surfaceDefault"
        borderColor="$borderSubtle"
        borderRadius={radii.xxl}
        borderWidth={1}
        gap="$3"
        justifyContent="center"
        minHeight={topUpCtaMinHeight}
        paddingHorizontal="$4"
        style={{
          ...elevations.soft,
          shadowColor: theme.actionPrimary.val,
          shadowOpacity: 0.08,
        }}
      >
        <View
          alignItems="center"
          backgroundColor="$surfaceAccent"
          borderRadius="$round"
          height={topUpIconShellSize}
          justifyContent="center"
          width={topUpIconShellSize}
        >
          <IconSymbol color={theme.actionPrimary.val} name="plus" size="md" />
        </View>

        <AppText tone="brand" variant="sectionTitle">
          Nạp tiền vào ví
        </AppText>
      </XStack>
    </Pressable>
  );
}
