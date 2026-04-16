import type { IconSymbolName } from "@components/IconSymbol";

import { IconSymbol } from "@components/IconSymbol";
import { elevations, radii } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { useTheme, XStack, YStack } from "tamagui";

type HeroMetric = {
  icon: IconSymbolName;
  label: string;
};

type EnvironmentImpactHeroCardProps = {
  eyebrow: string;
  value: string;
  unit: string;
  metrics?: ReadonlyArray<HeroMetric | undefined>;
};

export const EnvironmentImpactHeroCard = memo(({
  eyebrow,
  value,
  unit,
  metrics = [],
}: EnvironmentImpactHeroCardProps) => {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={["#0F766E", "#10B981"]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{
        borderRadius: radii.xxl,
        padding: 24,
        ...elevations.medium,
      }}
    >
      <YStack gap="$5">
        <YStack gap="$2">
          <AppText opacity={0.86} tone="inverted" variant="eyebrow">
            {eyebrow}
          </AppText>
          <XStack alignItems="flex-end" gap="$2" flexWrap="wrap">
            <AppText selectable style={{ fontVariant: ["tabular-nums"] }} tone="inverted" variant="hero">
              {value}
            </AppText>
            <AppText tone="inverted" variant="sectionTitle">
              {unit}
            </AppText>
          </XStack>
        </YStack>

        <XStack alignItems="center" flexWrap="wrap" gap="$3">
          {metrics.filter(Boolean).map(metric => (
            <XStack
              key={metric!.label}
              alignItems="center"
              backgroundColor="rgba(0,0,0,0.12)"
              borderRadius="$4"
              gap="$2"
              paddingHorizontal="$4"
              paddingVertical="$3"
            >
              <IconSymbol color={theme.onSurfaceBrand.val} name={metric!.icon} size="sm" />
              <AppText tone="inverted" variant="subhead">
                {metric!.label}
              </AppText>
            </XStack>
          ))}
        </XStack>
      </YStack>
    </LinearGradient>
  );
});
