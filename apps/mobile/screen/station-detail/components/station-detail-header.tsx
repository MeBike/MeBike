import { useTheme, XStack } from "tamagui";

import type { StationReadSummary } from "@/contracts/server";

import { IconSymbol } from "@components/IconSymbol";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";

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
          <IconSymbol name="location.fill" size={14} color={theme.onSurfaceBrand.val} />
          <AppText
            selectable
            flexShrink={1}
            numberOfLines={1}
            opacity={0.9}
            tone="inverted"
            variant="bodySmall"
          >
            {station.address}
          </AppText>
          <XStack
            backgroundColor={theme.onSurfaceBrand.val}
            borderRadius="$round"
            height={4}
            opacity={0.45}
            width={4}
          />
          <AppText selectable opacity={0.9} tone="inverted" variant="bodySmall">
            {station.capacity.total}
            {" "}
            chỗ
          </AppText>
        </XStack>
      )}
      title={station.name}
    />
  );
}
