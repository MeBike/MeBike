import React from "react";
import { Pressable, View } from "react-native";
import { useTheme, XStack } from "tamagui";

import { radii } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

import type { ReservationFilter } from "../hooks/use-reservations";

type FilterOption = {
  key: ReservationFilter;
  label: string;
};

type ReservationsFilterProps = {
  filters: FilterOption[];
  activeFilter: ReservationFilter;
  onChange: (filter: ReservationFilter) => void;
};

export function ReservationsFilter({ filters, activeFilter, onChange }: ReservationsFilterProps) {
  const theme = useTheme();

  return (
    <XStack
      backgroundColor="$overlayGlass"
      borderRadius={radii.round}
      gap="$1"
      overflow="hidden"
      padding="$1"
      width="100%"
    >
      {filters.map((filter) => {
        const isActive = filter.key === activeFilter;

        return (
          <Pressable
            key={filter.key}
            onPress={() => {
              if (!isActive) {
                onChange(filter.key);
              }
            }}
            style={{ flex: 1 }}
          >
            {({ pressed }) => (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 44,
                  paddingHorizontal: 20,
                  borderRadius: radii.round,
                  overflow: "hidden",
                  opacity: pressed ? 0.9 : 1,
                  backgroundColor: isActive ? theme.surfaceDefault.val : "transparent",
                }}
              >
                <AppText
                  numberOfLines={1}
                  tone={isActive ? "brand" : "inverted"}
                  variant="tabLabel"
                  style={{
                    opacity: isActive ? 1 : 0.86,
                  }}
                >
                  {filter.label}
                </AppText>
              </View>
            )}
          </Pressable>
        );
      })}
    </XStack>
  );
}
