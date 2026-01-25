import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import type { StationType } from "../../../types/StationType";

import { StationCard } from "../../../components/StationCard";

const styles = StyleSheet.create({
  list: {
    gap: 12,
    padding: 16,
  },
  emptyState: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
});

type StationSelectListProps = {
  stations: StationType[];
  refreshing: boolean;
  onRefresh: () => void;
  onSelectStation: (stationId: string) => void;
};

export function StationSelectList({
  stations,
  refreshing,
  onRefresh,
  onSelectStation,
}: StationSelectListProps) {
  if (!Array.isArray(stations) || stations.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Không có trạm nào khả dụng</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={stations}
      keyExtractor={item => item._id}
      renderItem={({ item }) => (
        <StationCard station={item} onPress={() => onSelectStation(item._id)} />
      )}
      contentContainerStyle={styles.list}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0066FF"]}
          tintColor="#0066FF"
        />
      )}
    />
  );
}
