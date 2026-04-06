import { Pressable } from "react-native";
import { XStack, YStack } from "tamagui";

import type { StaffBikeSwapTab } from "@/screen/staff/bike-swap/list/hooks/use-staff-bike-swap-list-screen";

import { AppText } from "@/ui/primitives/app-text";

type BikeSwapTabBarProps = {
  activeTab: StaffBikeSwapTab;
  onChangeTab: (tab: StaffBikeSwapTab) => void;
  pendingCount: number;
};

function TabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        opacity: pressed ? 0.98 : 1,
        transform: [{ scale: pressed ? 0.995 : 1 }],
      })}
    >
      <YStack
        alignItems="center"
        backgroundColor={active ? "$surfaceDefault" : "$overlayGlass"}
        borderRadius="$4"
        paddingHorizontal="$4"
        paddingVertical="$4"
      >
        <AppText tone={active ? "brand" : "inverted"} variant="tabLabel">
          {label}
        </AppText>
      </YStack>
    </Pressable>
  );
}

export function BikeSwapTabBar({ activeTab, onChangeTab, pendingCount }: BikeSwapTabBarProps) {
  return (
    <XStack gap="$3">
      <TabButton
        active={activeTab === "PENDING"}
        label={`Chờ xử lý (${pendingCount})`}
        onPress={() => onChangeTab("PENDING")}
      />
      <TabButton
        active={activeTab === "HISTORY"}
        label="Lịch sử"
        onPress={() => onChangeTab("HISTORY")}
      />
    </XStack>
  );
}
