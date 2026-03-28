import { IconSymbol } from "@components/IconSymbol";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";
import { useTheme, XStack } from "tamagui";

import type { StationReadSummary } from "@/contracts/server";

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
      accessory={<StatusBadge label="HOẠT ĐỘNG" size="compact" tone="overlaySuccess" />}
      onBack={onBack}
      size="default"
      subtitle={(
        <XStack alignItems="center" gap="$2">
          <XStack alignItems="center" flex={1} gap="$2" minWidth={0}>
            <IconSymbol name="location.fill" size={14} color={theme.onSurfaceBrand.val} />
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
