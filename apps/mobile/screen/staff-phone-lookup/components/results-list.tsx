import React from "react";
import { View } from "react-native";

import type { RentalListItem } from "@/types/rental-types";

import { styles } from "../styles";
import { ResultCard } from "./result-card";

export function ResultsList({
  rentals,
  getStationName,
  getStatusColor,
  getStatusText,
  getBikeLabel,
  getStartTimeLabel,
  getDurationLabel,
  onSelect,
  shortenId,
}: {
  rentals: RentalListItem[];
  getStationName: (id: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  getBikeLabel: (id: string) => string;
  getStartTimeLabel: (startTime: string) => string;
  getDurationLabel: (duration: number) => string;
  onSelect: (id: string) => void;
  shortenId: (id: string) => string;
}) {
  return (
    <View style={styles.resultsContainer}>
      {rentals.map(rental => (
        <ResultCard
          key={rental.id}
          title={rental.user?.fullname || "Khách hàng"}
          rentalIdLabel={`Mã thuê: ${shortenId(rental.id)}`}
          statusText={getStatusText(rental.status)}
          statusColor={getStatusColor(rental.status)}
          bikeIdLabel={`Xe: ${getBikeLabel(rental.bikeId)}`}
          startTimeLabel={`Bắt đầu: ${getStartTimeLabel(rental.startTime)}`}
          durationLabel={`Thời lượng: ${getDurationLabel(rental.duration)}`}
          stationLabel={`Trạm xuất phát: ${getStationName(rental.startStation)}`}
          onPress={() => onSelect(rental.id)}
        />
      ))}
    </View>
  );
}
