import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations, radii, spaceScale } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { Pressable } from "react-native";
import { useTheme, View, XStack } from "tamagui";

type WalletActionBarProps = {
  onTopUpPress: () => void;
  onWithdrawPress: () => void;
};

const actionBarMinHeight = spaceScale[10] + spaceScale[2];

function ActionButton({
  iconColor,
  iconName,
  label,
  onPress,
}: {
  iconColor: string;
  iconName: "plus" | "arrow-down";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.95 : 1 })}>
      <XStack alignItems="center" flex={1} gap="$3" justifyContent="center" minHeight={actionBarMinHeight} paddingHorizontal="$4">
        <IconSymbol color={iconColor} name={iconName} size="md" />
        <AppText variant="sectionTitle">{label}</AppText>
      </XStack>
    </Pressable>
  );
}

export function WalletActionBar({ onTopUpPress, onWithdrawPress }: WalletActionBarProps) {
  const theme = useTheme();

  return (
    <XStack
      alignItems="stretch"
      backgroundColor="$surfaceDefault"
      borderColor="$borderSubtle"
      borderRadius={radii.xxl}
      borderWidth={borderWidths.subtle}
      overflow="hidden"
      style={{
        ...elevations.soft,
        shadowColor: theme.actionPrimary.val,
        shadowOpacity: 0.08,
      }}
    >
      <ActionButton iconColor={theme.actionPrimary.val} iconName="plus" label="Nạp tiền" onPress={onTopUpPress} />

      <View backgroundColor="$borderSubtle" marginVertical="$3" width={1} />

      <ActionButton iconColor={theme.textSecondary.val} iconName="arrow-down" label="Rút tiền" onPress={onWithdrawPress} />
    </XStack>
  );
}
