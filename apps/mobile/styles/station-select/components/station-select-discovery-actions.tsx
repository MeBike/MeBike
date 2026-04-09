import { XStack } from "tamagui";

import { StationSelectActionChip } from "./station-select-action-chip";

type StationSelectDiscoveryActionsProps = {
  showingNearby: boolean;
  isLoadingNearbyStations: boolean;
  onOpenList: () => void;
  onToggleNearby: () => void;
};

export function StationSelectDiscoveryActions({
  showingNearby,
  isLoadingNearbyStations,
  onOpenList,
  onToggleNearby,
}: StationSelectDiscoveryActionsProps) {
  return (
    <XStack gap="$3" paddingHorizontal="$5" paddingBottom="$5">
      <StationSelectActionChip icon="list" label="Danh sách" onPress={onOpenList} />
      <StationSelectActionChip
        selected={showingNearby}
        disabled={isLoadingNearbyStations}
        icon="crosshair"
        label={showingNearby ? "Tất cả" : "Gần tôi"}
        onPress={onToggleNearby}
      />
    </XStack>
  );
}
