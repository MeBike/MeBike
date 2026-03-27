import { useTheme, XStack, YStack } from "tamagui";

import type { StationReadSummary } from "@/contracts/server";

import { AppText } from "@ui/primitives/app-text";

type StationStatsProps = {
  station: StationReadSummary;
};

function StatColumn({
  value,
  label,
  dotColor,
}: {
  value: number;
  label: string;
  dotColor: string;
}) {
  return (
    <YStack alignItems="center" flex={1} gap="$2" paddingHorizontal="$3" paddingVertical="$2">
      <AppText selectable style={{ fontVariant: ["tabular-nums"] }} variant="hero">
        {value}
      </AppText>
      <XStack alignItems="center" gap="$2">
        <XStack backgroundColor={dotColor} borderRadius="$round" height={8} width={8} />
        <AppText tone="muted" variant="caption">
          {label}
        </AppText>
      </XStack>
    </YStack>
  );
}

export function StationStats({ station }: StationStatsProps) {
  const theme = useTheme();

  return (
    <XStack
      alignItems="stretch"
      backgroundColor="$surfaceDefault"
      borderColor="$borderSubtle"
      borderRadius={20}
      borderWidth={1}
      paddingHorizontal="$5"
      paddingVertical="$4"
      style={{
        shadowColor: theme.shadowColor.val,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 6,
      }}
    >
      <StatColumn dotColor={theme.actionPrimary.val} label="Xe có sẵn" value={station.bikes.available} />
      <XStack alignSelf="stretch" backgroundColor="$borderSubtle" marginVertical="$2" width={1} />
      <StatColumn dotColor={theme.textPrimary.val} label="Chỗ trả xe" value={station.returnSlots.available} />
    </XStack>
  );
}
