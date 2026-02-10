import { FlatList, RefreshControl, StyleSheet } from "react-native";

import type { StationType } from "@/types/StationType";

import { StationCard } from "@/components/StationCard";

const styles = StyleSheet.create({
  list: {
    gap: 12,
    padding: 16,
  },
});

type StationListProps = {
  stations: StationType[];
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
      keyExtractor={item => item._id}
      renderItem={({ item }) => (
        <StationCard
          station={item}
          onPress={() => onSelectStation(item._id)}
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
