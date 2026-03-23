import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { XStack } from "tamagui";

import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral" | "inverted" | "overlaySuccess";
type StatusBadgeSize = "default" | "compact";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  size?: StatusBadgeSize;
  withDot?: boolean;
  pulseDot?: boolean;
};

const toneStyles: Record<StatusBadgeTone, { bg: string; textTone: "success" | "warning" | "danger" | "muted" | "inverted"; dot: string }> = {
  success: { bg: colors.successSoft, textTone: "success", dot: "$success" },
  warning: { bg: colors.warningSoft, textTone: "warning", dot: "$warning" },
  danger: { bg: colors.errorSoft, textTone: "danger", dot: "$error" },
  neutral: { bg: colors.neutralSoft, textTone: "muted", dot: "$textMuted" },
  inverted: { bg: colors.overlayLight, textTone: "inverted", dot: "$textOnBrand" },
  overlaySuccess: { bg: colors.overlayLight, textTone: "inverted", dot: "#6EE7B7" },
};

const sizeStyles: Record<StatusBadgeSize, { dotSize: number; gap: "$1" | "$2"; px: "$3"; py: "$2"; textStyle?: { fontSize: number; fontWeight: "700"; letterSpacing: number; lineHeight: number } }> = {
  default: {
    dotSize: 8,
    gap: "$2",
    px: "$3",
    py: "$2",
  },
  compact: {
    dotSize: 6,
    gap: "$1",
    px: "$3",
    py: "$2",
    textStyle: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.8,
      lineHeight: 12,
    },
  },
};

export function StatusBadge({
  label,
  tone = "neutral",
  size = "default",
  withDot = true,
  pulseDot = false,
}: StatusBadgeProps) {
  const style = toneStyles[tone];
  const sizeStyle = sizeStyles[size];
  const dotScale = useSharedValue(1);
  const dotOpacity = useSharedValue(1);

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
      alignItems="center"
      backgroundColor={style.bg}
      borderRadius="$round"
      gap={sizeStyle.gap}
      paddingHorizontal={sizeStyle.px}
      paddingVertical={sizeStyle.py}
      width="auto"
    >
      {withDot
        ? (
            <Animated.View
              style={animatedDotStyle}
            >
              <XStack
                backgroundColor={style.dot}
                borderRadius="$round"
                height={sizeStyle.dotSize}
                width={sizeStyle.dotSize}
              />
            </Animated.View>
          )
        : null}
      <AppText style={sizeStyle.textStyle} tone={style.textTone} variant="caption">
        {label}
      </AppText>
    </XStack>
  );
}
