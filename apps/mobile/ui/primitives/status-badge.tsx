import { AppText } from "@ui/primitives/app-text";
import { XStack } from "tamagui";

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral" | "inverted";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  withDot?: boolean;
};

const toneStyles: Record<StatusBadgeTone, { bg: string; textTone: "success" | "warning" | "danger" | "muted" | "inverted"; dot: string }> = {
  success: { bg: "rgba(16, 185, 129, 0.16)", textTone: "success", dot: "$success" },
  warning: { bg: "rgba(245, 158, 11, 0.16)", textTone: "warning", dot: "$warning" },
  danger: { bg: "rgba(239, 68, 68, 0.16)", textTone: "danger", dot: "$error" },
  neutral: { bg: "rgba(255, 255, 255, 0.18)", textTone: "muted", dot: "$textMuted" },
  inverted: { bg: "rgba(255, 255, 255, 0.2)", textTone: "inverted", dot: "$textOnBrand" },
};

export function StatusBadge({ label, tone = "neutral", withDot = true }: StatusBadgeProps) {
  const style = toneStyles[tone];

  return (
    <XStack
      alignItems="center"
      backgroundColor={style.bg}
      borderRadius="$round"
      gap="$2"
      paddingHorizontal="$3"
      paddingVertical="$2"
      width="auto"
    >
      {withDot
        ? (
            <XStack
              backgroundColor={style.dot}
              borderRadius="$round"
              height={8}
              width={8}
            />
          )
        : null}
      <AppText tone={style.textTone} variant="caption">
        {label}
      </AppText>
    </XStack>
  );
}
