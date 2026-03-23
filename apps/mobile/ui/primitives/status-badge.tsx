import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";
import { XStack } from "tamagui";

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral" | "inverted" | "overlaySuccess";
type StatusBadgeSize = "default" | "compact";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  size?: StatusBadgeSize;
  withDot?: boolean;
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
}: StatusBadgeProps) {
  const style = toneStyles[tone];
  const sizeStyle = sizeStyles[size];

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
            <XStack
              backgroundColor={style.dot}
              borderRadius="$round"
              height={sizeStyle.dotSize}
              width={sizeStyle.dotSize}
            />
          )
        : null}
      <AppText style={sizeStyle.textStyle} tone={style.textTone} variant="caption">
        {label}
      </AppText>
    </XStack>
  );
}
