import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { useTheme, XStack } from "tamagui";

type EnvironmentSummaryStatCardProps = {
  icon: "wind" | "bike";
  label: string;
  value: string;
  iconBackground?: string;
  iconColor?: string;
};

export function EnvironmentSummaryStatCard({
  icon,
  label,
  value,
  iconBackground = "$surfaceAccent",
  iconColor,
}: EnvironmentSummaryStatCardProps) {
  const theme = useTheme();

  return (
    <AppCard
      borderColor="$borderSubtle"
      borderRadius="$5"
      borderWidth={borderWidths.subtle}
      chrome="flat"
      flex={1}
      gap="$3"
      padding="$4"
      style={elevations.whisper}
    >
      <XStack alignItems="center" gap="$3">
        <XStack
          alignItems="center"
          backgroundColor={iconBackground}
          borderRadius="$round"
          height={40}
          justifyContent="center"
          width={40}
        >
          <IconSymbol color={iconColor ?? theme.actionPrimary.val} name={icon} size="sm" />
        </XStack>

        <AppText flex={1} tone="subtle" variant="eyebrow">
          {label}
        </AppText>
      </XStack>

      <AppText style={{ fontVariant: ["tabular-nums"] }} variant="cardTitle">
        {value}
      </AppText>
    </AppCard>
  );
}
