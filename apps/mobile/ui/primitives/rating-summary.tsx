import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";
import { XStack } from "tamagui";

type RatingSummarySize = "default" | "compact";

type RatingSummaryProps = {
  averageRating: number;
  totalRatings: number;
  size?: RatingSummarySize;
  emptyLabel?: string;
};

const sizeStyles: Record<RatingSummarySize, {
  iconSize: number;
  gap: "$1" | "$1.5";
  variant: "caption" | "label";
}> = {
  default: {
    iconSize: 14,
    gap: "$1.5",
    variant: "label",
  },
  compact: {
    iconSize: 12,
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
  const style = sizeStyles[size];
  const hasRatings = totalRatings > 0;

  return (
    <XStack alignItems="center" gap={style.gap}>
      <IconSymbol name={hasRatings ? "star.fill" : "star"} size={style.iconSize} color={colors.brandAccent} />
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
