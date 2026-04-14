import { AppButton } from "@ui/primitives/app-button";
import {
  ScrollView,
} from "react-native";
import { XStack, YStack } from "tamagui";

import type { FixedSlotStatus } from "@/contracts/server";

type FilterOption = {
  label: string;
  value?: FixedSlotStatus;
};

type FixedSlotFilterBarProps = {
  filters: FilterOption[];
  activeFilter?: FixedSlotStatus;
  onFilterChange: (value: FixedSlotStatus | undefined) => void;
  onCreate: () => void;
};

export function FixedSlotFilterBar({
  filters,
  activeFilter,
  onFilterChange,
  onCreate,
}: FixedSlotFilterBarProps) {
  return (
    <YStack gap="$3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$2" paddingRight="$2">
          {filters.map((item) => {
            const isActive = item.value === activeFilter || (!item.value && !activeFilter);

            return (
              <AppButton
                key={item.label}
                buttonSize="compact"
                onPress={() => onFilterChange(item.value)}
                tone={isActive ? "primary" : "ghost"}
              >
                {item.label}
              </AppButton>
            );
          })}
        </XStack>
      </ScrollView>
      <AppButton onPress={onCreate} tone="secondary">Tạo khung giờ</AppButton>
    </YStack>
  );
}
