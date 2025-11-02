import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Reservation } from "../../types/reservation-types";

import { ReservationCard } from "./reservation-card";
import { ReservationEmptyState } from "./reservation-empty-state";

type SectionData = {
  title: string;
  description: string;
  data: Reservation[];
  emptyText: string;
};

type ReservationSectionProps = {
  section: SectionData;
  stationMap: Map<string, { name: string; address?: string }>;
  onReservationPress: (reservation: Reservation) => void;
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#607D8B",
  },
});

export function ReservationSection({
  section,
  stationMap,
  onReservationPress,
}: ReservationSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionSubtitle}>{section.description}</Text>
      </View>
      {section.data.length > 0
        ? (
            section.data.map((reservation) => {
              const stationInfo = stationMap.get(reservation.station_id);
              return (
                <ReservationCard
                  key={reservation._id}
                  reservation={reservation}
                  stationName={stationInfo?.name}
                  stationId={reservation.station_id}
                  onPress={() => onReservationPress(reservation)}
                />
              );
            })
          )
        : (
            <ReservationEmptyState message={section.emptyText} />
          )}
    </View>
  );
}
