import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { ListRenderItemInfo } from "react-native";

import type { FixedSlotStatus } from "@/types/fixed-slot-types";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: BikeColors.surface,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: BikeColors.primary,
  },
  chipText: {
    color: BikeColors.textPrimary,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  createButton: {
    marginTop: 8,
    backgroundColor: BikeColors.primary,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

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
  const renderFilterItem = ({ item }: ListRenderItemInfo<FilterOption>) => {
    const isActive =
      item.value === activeFilter || (!item.value && !activeFilter);
    return (
      <TouchableOpacity
        style={[styles.chip, isActive && styles.chipActive]}
        onPress={() => onFilterChange(item.value)}
      >
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filters}
        keyExtractor={item => item.label}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderFilterItem}
      />
      <TouchableOpacity style={styles.createButton} onPress={onCreate}>
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Tạo khung giờ</Text>
      </TouchableOpacity>
    </View>
  );
}
