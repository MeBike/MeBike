import { LoadingScreen } from "@components/LoadingScreen";
import { StatusBar, StyleSheet, View } from "react-native";

import { StationList } from "./components/station-list";
import { StationSelectHeader } from "./components/station-select-header";
import { useStationSelect } from "./hooks/use-station-select";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 0,
  },
});

export default function StationSelectScreen() {
  const {
    stations,
    refreshing,
    showingNearby,
    isLoadingNearbyStations,
    handleSelectStation,
    handleFindNearbyStations,
    handleRefresh,
    insets,
  } = useStationSelect();

  if (
    !Array.isArray(stations)
    || stations === null
    || stations.length === 0
  ) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <StationSelectHeader
        showingNearby={showingNearby}
        isLoadingNearbyStations={isLoadingNearbyStations}
        insets={insets}
        onFindNearby={handleFindNearbyStations}
      />
      <StationList
        stations={stations}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onSelectStation={handleSelectStation}
      />
    </View>
  );
}
