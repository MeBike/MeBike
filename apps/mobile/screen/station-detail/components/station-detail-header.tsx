import { XStack } from "tamagui";

import type { StationReadSummary } from "@/contracts/server";

import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
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
  return (
    <AppHeroHeader
      accessory={<StatusBadge label="HOẠT ĐỘNG" size="compact" tone="overlaySuccess" />}
      onBack={onBack}
      size="default"
      subtitle={(
        <XStack alignItems="center" gap="$1.5">
          <IconSymbol name="location.fill" size={14} color={colors.textOnBrand} />
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
            backgroundColor={colors.textOnBrand}
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
