import { Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { MapboxDirectionsProfile } from "@/lib/mapbox-directions";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, elevations } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";

const routeModes: Array<{
  id: MapboxDirectionsProfile;
  icon: "footprints" | "bike" | "car";
  label: string;
}> = [
  { id: "walking", icon: "footprints", label: "Đi bộ" },
  { id: "cycling", icon: "bike", label: "Xe đạp" },
  { id: "driving", icon: "car", label: "Ô tô" },
];

type StationSelectRoutingPanelProps = {
  destinationLabel: string;
  routeProfile: MapboxDirectionsProfile;
  routeSummary: string | null;
  isRouting: boolean;
  hasDestination: boolean;
  hasRoute: boolean;
  onChangeRouteProfile: (profile: MapboxDirectionsProfile) => void;
  onResetSelection: () => void;
  onBuildRoute: () => void;
  onClearRoute: () => void;
};

export function StationSelectRoutingPanel({
  destinationLabel,
  routeProfile,
  routeSummary,
  isRouting,
  hasDestination,
  hasRoute,
  onChangeRouteProfile,
  onResetSelection,
  onBuildRoute,
  onClearRoute,
}: StationSelectRoutingPanelProps) {
  const theme = useTheme();

  return (
    <YStack gap="$5" paddingHorizontal="$5" paddingBottom="$5">
      <YStack backgroundColor="$surfaceMuted" borderRadius="$5" padding="$1">
        <XStack gap="$1">
          {routeModes.map((mode) => {
            const isSelected = routeProfile === mode.id;

            return (
              <Pressable
                key={mode.id}
                disabled={isRouting}
                onPress={() => onChangeRouteProfile(mode.id)}
                style={{ flex: 1, opacity: isRouting ? 0.65 : 1 }}
              >
                <AppCard
                  alignItems="center"
                  backgroundColor={isSelected ? "$surfaceDefault" : "$surfaceMuted"}
                  borderColor={isSelected ? "$borderFocus" : "transparent"}
                  borderRadius="$3"
                  borderWidth={isSelected ? borderWidths.subtle : borderWidths.none}
                  chrome="flat"
                  flexDirection="row"
                  gap="$2"
                  justifyContent="center"
                  minHeight={46}
                  paddingHorizontal="$2"
                  paddingVertical="$2"
                  style={isSelected ? elevations.whisper : undefined}
                >
                  <IconSymbol
                    color={isSelected ? theme.textBrand.val : theme.textSecondary.val}
                    name={mode.icon}
                    size="caption"
                  />
                  <AppText tone={isSelected ? "brand" : "muted"} variant="compactStrong">
                    {mode.label}
                  </AppText>
                </AppCard>
              </Pressable>
            );
          })}
        </XStack>
      </YStack>

      {hasRoute
        ? (
            <XStack alignItems="center" gap="$3">
              <AppCard borderRadius="$4" chrome="flat" flex={1} tone="accent">
                <XStack alignItems="center" gap="$3">
                  <AppCard
                    alignItems="center"
                    backgroundColor="$surfaceDefault"
                    borderRadius="$round"
                    chrome="flat"
                    height={36}
                    justifyContent="center"
                    padding="$0"
                    width={36}
                  >
                    <IconSymbol color={theme.actionPrimary.val} name="clock" size="caption" />
                  </AppCard>
                  <YStack flex={1} gap="$0.5">
                    <AppText tone="brand" variant="eyebrow">Dự kiến</AppText>
                    <AppText numberOfLines={1} tone="brand" variant="subhead">
                      {routeSummary ?? destinationLabel}
                    </AppText>
                  </YStack>
                </XStack>
              </AppCard>

              <Pressable onPress={onClearRoute}>
                <AppCard
                  alignItems="center"
                  backgroundColor="$surfaceMuted"
                  borderColor="$borderSubtle"
                  borderRadius="$4"
                  borderWidth={borderWidths.subtle}
                  chrome="flat"
                  justifyContent="center"
                  minHeight={56}
                  paddingHorizontal="$5"
                >
                  <AppText tone="muted" variant="bodyStrong">Hủy</AppText>
                </AppCard>
              </Pressable>
            </XStack>
          )
        : (
            <XStack gap="$3">
              <AppButton buttonSize="large" flex={1} tone="outline" onPress={onResetSelection}>
                Đổi trạm
              </AppButton>
              <AppButton
                buttonSize="large"
                flex={1}
                loading={isRouting}
                onPress={onBuildRoute}
                disabled={!hasDestination || isRouting}
              >
                Tìm đường
              </AppButton>
            </XStack>
          )}
    </YStack>
  );
}
