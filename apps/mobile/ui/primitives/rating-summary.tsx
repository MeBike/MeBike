import type { IconSymbolSize } from "@components/IconSymbol";

import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";
import { useTheme, XStack } from "tamagui";

type RatingSummarySize = "default" | "compact";

type RatingSummaryProps = {
  averageRating: number;
  totalRatings: number;
  size?: RatingSummarySize;
  emptyLabel?: string;
};

const sizeStyles: Record<RatingSummarySize, {
  iconSize: IconSymbolSize;
  gap: "$1" | "$2";
  variant: "caption" | "label";
}> = {
  default: {
    iconSize: "caption",
    gap: "$2",
    variant: "label",
  },
  compact: {
    iconSize: "xs",
    gap: "$1",
    variant: "caption",
  },
};

function formatAverageRating(value: number) {
  return value.toFixed(1);
}

export function RatingSummary({
  averageRating,
  totalRatings,
  size = "default",
  emptyLabel = "Mới",
}: RatingSummaryProps) {
  const theme = useTheme();
  const style = sizeStyles[size];
  const hasRatings = totalRatings > 0;

  return (
    <XStack alignItems="center" gap={style.gap}>
      <IconSymbol name={hasRatings ? "star.fill" : "star"} size={style.iconSize} color={theme.actionAccent.val} />
      {hasRatings
        ? (
            <AppText selectable tone="muted" variant={style.variant}>
              {formatAverageRating(averageRating)}
              {" "}
              (
              {totalRatings}
              )
            </AppText>
          )
        : (
            <AppText selectable tone="muted" variant={style.variant}>
              {emptyLabel}
            </AppText>
          )}
    </XStack>
  );
}
