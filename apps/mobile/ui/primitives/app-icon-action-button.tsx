import { Pressable } from "react-native";
import { useTheme, XStack } from "tamagui";

import type { IconSymbolName } from "@/components/IconSymbol";

import { IconSymbol } from "@/components/IconSymbol";
import { borderWidths } from "@/theme/metrics";

type AppIconActionButtonTone = "accent" | "neutral" | "success" | "warning" | "danger";

type AppIconActionButtonProps = {
  icon: IconSymbolName;
  onPress: () => void;
  tone?: AppIconActionButtonTone;
  size?: number;
};

const toneStyles = {
  accent: { backgroundColor: "$surfaceAccent", borderColor: "$borderSubtle", iconColorKey: "textBrand" },
  neutral: { backgroundColor: "$surfaceDefault", borderColor: "$borderSubtle", iconColorKey: "textSecondary" },
  success: { backgroundColor: "$surfaceSuccess", borderColor: "$borderSubtle", iconColorKey: "textSuccess" },
  warning: { backgroundColor: "$surfaceWarning", borderColor: "$borderSubtle", iconColorKey: "textWarning" },
  danger: { backgroundColor: "$surfaceDanger", borderColor: "$borderSubtle", iconColorKey: "textDanger" },
} as const;

export function AppIconActionButton({
  icon,
  onPress,
  tone = "neutral",
  size = 44,
}: AppIconActionButtonProps) {
  const theme = useTheme();
  const style = toneStyles[tone];
  const iconColor = theme[style.iconColorKey].val;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <XStack
        alignItems="center"
        backgroundColor={style.backgroundColor}
        borderColor={style.borderColor}
        borderRadius="$round"
        borderWidth={borderWidths.subtle}
        height={size}
        justifyContent="center"
        width={size}
      >
        <IconSymbol color={iconColor} name={icon} size="sm" />
      </XStack>
    </Pressable>
  );
}
