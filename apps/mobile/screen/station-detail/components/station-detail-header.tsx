import { useTheme, XStack } from "tamagui";

import type { StationReadSummary } from "@/contracts/server";

import { IconSymbol } from "@components/IconSymbol";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { AppText } from "@ui/primitives/app-text";

type StationDetailHeaderProps = {
  onBack: () => void;
  station: StationReadSummary;
};

export function StationDetailHeader({
  onBack,
  station,
}: StationDetailHeaderProps) {
  const theme = useTheme();

  return (
    <AppHeroHeader
      onBack={onBack}
      size="default"
      subtitle={(
        <XStack alignItems="center" gap="$2">
          <XStack alignItems="center" flex={1} gap="$2" minWidth={0}>
            <IconSymbol color={theme.onSurfaceBrand.val} name="location" size="caption" variant="filled" />
            <AppText
              ellipsizeMode="tail"
              flex={1}
              minWidth={0}
              numberOfLines={1}
              opacity={0.9}
              tone="inverted"
              variant="bodySmall"
            >
              {station.address}
            </AppText>
          </XStack>
        </XStack>
      )}
      title={station.name}
    />
  );
}
