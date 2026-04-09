import { Pressable } from "react-native";
import { useTheme } from "tamagui";

import type { IconSymbolName } from "@components/IconSymbol";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

type StationSelectActionChipProps = {
  icon: IconSymbolName;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function StationSelectActionChip({
  icon,
  label,
  selected = false,
  disabled = false,
  onPress,
}: StationSelectActionChipProps) {
  const theme = useTheme();

  return (
    <Pressable disabled={disabled} onPress={onPress} style={{ flex: 1, opacity: disabled ? 0.65 : 1 }}>
      <AppCard
        alignItems="center"
        backgroundColor={selected ? "$surfaceDefault" : "$surfaceMuted"}
        borderColor={selected ? "$borderFocus" : "$borderSubtle"}
        borderRadius="$5"
        borderWidth={borderWidths.subtle}
        chrome="flat"
        flexDirection="row"
        gap="$2"
        justifyContent="center"
        minHeight={60}
        paddingHorizontal="$4"
        paddingVertical="$3"
        style={selected ? elevations.whisper : undefined}
      >
        <IconSymbol
          color={selected ? theme.textBrand.val : theme.textSecondary.val}
          name={icon}
          size="input"
        />
        <AppText tone={selected ? "brand" : "default"} variant="subhead">
          {label}
        </AppText>
      </AppCard>
    </Pressable>
  );
}
