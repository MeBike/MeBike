import { useAuth } from "@providers/auth-providers";
import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { ReservationHeader } from "../components/reservation-screen/reservation-header";
import { ReservationInlineLoader, ReservationLoadingState } from "../components/reservation-screen/reservation-loading-state";
import { ReservationSection } from "../components/reservation-screen/reservation-section";
import { useReservationData } from "../hooks/use-reservation-data";
import { useReservationNavigation } from "../hooks/use-reservation-navigation";

function ReservationScreen() {
  const { user } = useAuth();
  const hasToken = Boolean(user?._id);

  const {
    stationMap,
    sections,
    refreshing,
    isLoading,
    isFetching,
    onRefresh,
  } = useReservationData(hasToken);

  const { handleNavigateToDetail, canGoBack, goBack } = useReservationNavigation(stationMap);

  if (isLoading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F6FA" }}>
        <ReservationHeader canGoBack={canGoBack()} onGoBack={goBack} />
        <ReservationLoadingState />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F6FA" }}>
      <ReservationHeader canGoBack={canGoBack()} onGoBack={goBack} />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0066FF"]} />}
      >
        {isFetching && <ReservationInlineLoader />}

        {sections.map(section => (
          <ReservationSection
            key={section.title}
            section={section}
            stationMap={stationMap}
            onReservationPress={handleNavigateToDetail}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default ReservationScreen;
