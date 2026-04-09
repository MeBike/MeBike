import { FlatList, Pressable, RefreshControl } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { StationReadSummary } from "@/contracts/server";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";

import { formatAvailableBikeLabel, formatDistance } from "./station-select-map-overlay.utils";

type StationListItem = StationReadSummary & {
  distanceMeters?: number;
};

type StationListProps = {
  stations: StationListItem[];
  refreshing: boolean;
  onRefresh: () => void;
  onSelectStation: (stationId: string) => void;
};

export function StationList({
  stations,
  refreshing,
  onRefresh,
  onSelectStation,
}: StationListProps) {
  const theme = useTheme();

  return (
    <FlatList
      data={stations}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelectStation(item.id)}>
          <AppCard
            backgroundColor="$surfaceDefault"
            borderColor="$borderSubtle"
            borderRadius="$5"
            borderWidth={borderWidths.subtle}
            chrome="flat"
            gap="$4"
            marginHorizontal="$4"
            marginBottom="$4"
            padding="$5"
            style={elevations.soft}
          >
            <XStack alignItems="flex-start" gap="$4">
              <AppCard
                alignItems="center"
                backgroundColor={item.bikes.available > 0 ? "$surfaceAccent" : "$surfaceMuted"}
                borderRadius="$round"
                chrome="flat"
                height={60}
                justifyContent="center"
                padding="$0"
                width={60}
              >
                <IconSymbol
                  color={item.bikes.available > 0 ? theme.actionPrimary.val : theme.textTertiary.val}
                  name="location"
                  size="section"
                />
              </AppCard>

              <YStack flex={1} gap="$3">
                <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
                  <YStack flex={1} gap="$1">
                    <AppText numberOfLines={1} variant="cardTitle">{item.name}</AppText>
                    <AppText flex={1} numberOfLines={2} tone="muted" variant="bodySmall">
                      {item.address}
                    </AppText>
                  </YStack>

                  {typeof item.distanceMeters === "number"
                    ? (
                        <AppText tone="brand" variant="sectionTitle">
                          {formatDistance(item.distanceMeters)}
                        </AppText>
                      )
                    : null}
                </XStack>

                <StatusBadge
                  label={formatAvailableBikeLabel(item.bikes.available)}
                  pulseDot={item.bikes.available > 0}
                  tone={item.bikes.available > 0 ? "success" : "neutral"}
                  withDot={item.bikes.available > 0}
                />
              </YStack>
            </XStack>
          </AppCard>
        </Pressable>
      )}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
      ListEmptyComponent={(
        <YStack alignItems="center" gap="$2" padding="$6">
          <AppText align="center" variant="sectionTitle">Không tìm thấy trạm phù hợp</AppText>
          <AppText align="center" tone="muted" variant="bodySmall">
            Thử thay đổi từ khóa hoặc tắt bộ lọc gần bạn để xem thêm trạm.
          </AppText>
        </YStack>
      )}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.actionPrimary.val]}
          tintColor={theme.actionPrimary.val}
        />
      )}
    />
  );
}
