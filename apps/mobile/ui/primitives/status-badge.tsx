import type { IconSymbolName } from "@components/IconSymbol";
import type { AppTextTone } from "@ui/primitives/app-text";

import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme, XStack } from "tamagui";

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral" | "inverted" | "overlaySuccess";
type StatusBadgeSize = "default" | "compact";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  size?: StatusBadgeSize;
  withDot?: boolean;
  pulseDot?: boolean;
  iconName?: IconSymbolName;
};

type ThemeColorKey
  = | "statusSuccess"
    | "statusWarning"
    | "statusDanger"
    | "textTertiary"
    | "onSurfaceBrand";

const toneStyles: Record<StatusBadgeTone, { bg: `$${string}`; textTone: AppTextTone; dotKey: ThemeColorKey }> = {
  success: { bg: "$surfaceSuccess", textTone: "success", dotKey: "statusSuccess" },
  warning: { bg: "$surfaceWarning", textTone: "warning", dotKey: "statusWarning" },
  danger: { bg: "$surfaceDanger", textTone: "danger", dotKey: "statusDanger" },
  neutral: { bg: "$surfaceMuted", textTone: "muted", dotKey: "textTertiary" },
  inverted: { bg: "$overlayGlass", textTone: "inverted", dotKey: "onSurfaceBrand" },
  overlaySuccess: { bg: "$overlayGlass", textTone: "inverted", dotKey: "statusSuccess" },
};

const sizeStyles: Record<StatusBadgeSize, { dotSize: number; gap: "$1" | "$2"; px: "$3"; py: "$2"; textVariant: "caption" | "badgeLabel" }> = {
  default: {
    dotSize: 8,
    gap: "$2",
    px: "$3",
    py: "$2",
    textVariant: "caption",
  },
  compact: {
    dotSize: 6,
    gap: "$1",
    px: "$3",
    py: "$2",
    textVariant: "badgeLabel",
  },
};

export function StatusBadge({
  label,
  tone = "neutral",
  size = "default",
  withDot = true,
  pulseDot = false,
  iconName,
}: StatusBadgeProps) {
  const theme = useTheme();
  const style = toneStyles[tone];
  const sizeStyle = sizeStyles[size];
  const dotScale = useSharedValue(1);
  const dotOpacity = useSharedValue(1);
  const dotColor = (theme as Record<string, { val?: string }>)[style.dotKey]?.val ?? theme.textPrimary.val;

  useEffect(() => {
    if (!pulseDot || !withDot) {
      dotScale.value = 1;
      dotOpacity.value = 1;
      return;
    }

    dotScale.value
      = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    dotOpacity.value
      = withRepeat(
        withSequence(
          withTiming(0.65, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
  }, [dotOpacity, dotScale, pulseDot, withDot]);

  const animatedDotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <XStack
      alignSelf="flex-start"
      alignItems="center"
      backgroundColor={style.bg}
      borderRadius="$round"
      flexShrink={0}
      gap={sizeStyle.gap}
      paddingHorizontal={sizeStyle.px}
      paddingVertical={sizeStyle.py}
      width="auto"
    >
      {iconName
        ? <IconSymbol color={dotColor} name={iconName} size={size === "compact" ? 14 : 16} />
        : null}
      {withDot && !iconName
        ? (
            <Animated.View
              style={animatedDotStyle}
            >
              <XStack
                backgroundColor={dotColor}
                borderRadius="$round"
                height={sizeStyle.dotSize}
                width={sizeStyle.dotSize}
              />
            </Animated.View>
          )
        : null}
      <AppText tone={style.textTone} variant={sizeStyle.textVariant}>
        {label}
      </AppText>
    </XStack>
  );
}
