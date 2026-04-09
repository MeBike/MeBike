import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

import { formatAvailableBikeLabel } from "./station-select-map-overlay.utils";

type StationSelectPreviewCardProps = {
  destinationLabel: string;
  selectedStationAddress?: string | null;
  selectedStationAvailableBikes?: number | null;
  onEnterRoutingMode: () => void;
  onOpenStationDetail: () => void;
};

export function StationSelectPreviewCard({
  destinationLabel,
  selectedStationAddress,
  selectedStationAvailableBikes,
  onEnterRoutingMode,
  onOpenStationDetail,
}: StationSelectPreviewCardProps) {
  const theme = useTheme();

  return (
    <YStack gap="$4" paddingHorizontal="$5" paddingBottom="$5">
      <YStack gap="$2">
        <AppText tone="subtle" variant="eyebrow">Trạm đã chọn</AppText>
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
          <AppText flex={1} numberOfLines={2} variant="title">{destinationLabel}</AppText>
          {typeof selectedStationAvailableBikes === "number"
            ? (
                <AppCard
                  backgroundColor={selectedStationAvailableBikes > 0 ? "$surfaceSuccess" : "$surfaceMuted"}
                  borderColor={selectedStationAvailableBikes > 0 ? "$statusSuccess" : "$borderSubtle"}
                  borderRadius="$3"
                  borderWidth={borderWidths.subtle}
                  chrome="flat"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                >
                  <AppText
                    tone={selectedStationAvailableBikes > 0 ? "success" : "subtle"}
                    variant="compactStrong"
                  >
                    {formatAvailableBikeLabel(selectedStationAvailableBikes)}
                  </AppText>
                </AppCard>
              )
            : null}
        </XStack>

        {selectedStationAddress
          ? (
              <XStack alignItems="flex-start" gap="$2">
                <IconSymbol color={theme.textTertiary.val} name="location" size="caption" variant="filled" />
                <AppText flex={1} tone="muted" variant="bodySmall">{selectedStationAddress}</AppText>
              </XStack>
            )
          : null}
      </YStack>

      <XStack gap="$3">
        <AppButton buttonSize="large" flex={1.4} onPress={onEnterRoutingMode}>
          <XStack alignItems="center" gap="$2">
            <IconSymbol color={theme.onActionPrimary.val} name="map" size="input" />
            <AppText tone="inverted" variant="bodySmall">Chỉ đường</AppText>
          </XStack>
        </AppButton>

        <AppButton buttonSize="large" flex={1} tone="outline" onPress={onOpenStationDetail}>
          Chi tiết
        </AppButton>
      </XStack>
    </YStack>
  );
}
