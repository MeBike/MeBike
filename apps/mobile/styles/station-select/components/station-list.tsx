import { FlatList, RefreshControl, StyleSheet } from "react-native";

import type { StationReadSummary } from "@/contracts/server";

import { StationCard } from "@/components/StationCard";

const styles = StyleSheet.create({
  list: {
    gap: 12,
    padding: 16,
  },
});

type StationListProps = {
  stations: StationReadSummary[];
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
  return (
    <FlatList
      data={stations}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <StationCard
          station={item}
          onPress={() => onSelectStation(item.id)}
        />
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
