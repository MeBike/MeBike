import { AppButton } from "@ui/primitives/app-button";
import {
  ScrollView,
} from "react-native";
import { XStack } from "tamagui";

import type { FixedSlotStatus } from "@/contracts/server";

type FilterOption = {
  label: string;
  value?: FixedSlotStatus;
};

type FixedSlotFilterBarProps = {
  filters: FilterOption[];
  activeFilter?: FixedSlotStatus;
  onFilterChange: (value: FixedSlotStatus | undefined) => void;
};

export function FixedSlotFilterBar({
  filters,
  activeFilter,
  onFilterChange,
}: FixedSlotFilterBarProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <XStack gap="$2" paddingRight="$2">
        {filters.map((item) => {
          const isActive = item.value === activeFilter || (!item.value && !activeFilter);

          return (
            <AppButton
              key={item.label}
              buttonSize="compact"
              onPress={() => onFilterChange(item.value)}
              tone={isActive ? "soft" : "ghost"}
            >
              {item.label}
            </AppButton>
          );
        })}
      </XStack>
    </ScrollView>
  );
}
