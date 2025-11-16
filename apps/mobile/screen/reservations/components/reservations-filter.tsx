import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#1B2340",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badge: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F4FB",
  },
  badgeActive: {
    backgroundColor: "#0066FF",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5C6E8C",
    textTransform: "uppercase",
  },
  badgeTextActive: {
    color: "#FFFFFF",
  },
});

export function ReservationsFilter({ filters, activeFilter, onChange }: ReservationsFilterProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {filters.map((filter) => {
          const isActive = filter.key === activeFilter;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.badge, isActive && styles.badgeActive]}
              onPress={() => {
                if (!isActive) {
                  onChange(filter.key);
                }
              }}
              activeOpacity={0.9}
            >
              <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
