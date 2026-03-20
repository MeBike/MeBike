import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";
import { XStack } from "tamagui";

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral" | "inverted";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  withDot?: boolean;
};

const toneStyles: Record<StatusBadgeTone, { bg: string; textTone: "success" | "warning" | "danger" | "muted" | "inverted"; dot: string }> = {
  success: { bg: colors.successSoft, textTone: "success", dot: "$success" },
  warning: { bg: colors.warningSoft, textTone: "warning", dot: "$warning" },
  danger: { bg: colors.errorSoft, textTone: "danger", dot: "$error" },
  neutral: { bg: colors.neutralSoft, textTone: "muted", dot: "$textMuted" },
  inverted: { bg: colors.overlayLight, textTone: "inverted", dot: "$textOnBrand" },
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
