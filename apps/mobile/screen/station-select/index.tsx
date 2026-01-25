import { LoadingScreen } from "@components/LoadingScreen";
import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StationSelectHeader } from "./components/station-select-header";
import { StationSelectList } from "./components/station-select-list";
import { useStationSelect } from "./hooks/use-station-select";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 0,
  },
});

export default function StationSelectScreen() {
  const insets = useSafeAreaInsets();
  const {
    stations,
    isLoading,
    refreshing,
    handleRefresh,
    handleSelectStation,
  } = useStationSelect();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <StationSelectHeader
        insets={insets}
        onNearbyPress={() => undefined}
        nearbyDisabled
      />
      <StationSelectList
        stations={stations}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onSelectStation={handleSelectStation}
      />
    </View>
  );
}
