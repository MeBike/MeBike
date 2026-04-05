import React from "react";
import { YStack } from "tamagui";

import type { RentalListItem } from "@/types/rental-types";

import { ResultCard } from "./result-card";

export function ResultsList({
  rentals,
  getStationName,
  getStatusTone,
  getStatusText,
  getBikeLabel,
  getStartTimeLabel,
  getDurationLabel,
  onSelect,
  shortenId,
}: {
  rentals: RentalListItem[];
  getStationName: (id: string) => string;
  getStatusTone: (status: string) => "success" | "warning" | "danger" | "neutral";
  getStatusText: (status: string) => string;
  getBikeLabel: (id: string) => string;
  getStartTimeLabel: (startTime: string) => string;
  getDurationLabel: (duration: number) => string;
  onSelect: (id: string) => void;
  shortenId: (id: string) => string;
}) {
  return (
    <YStack gap="$4">
      {rentals.map(rental => (
        <ResultCard
          key={rental.id}
          bikeIdLabel={`Xe: ${getBikeLabel(rental.bikeId)}`}
          durationLabel={`Thời lượng: ${getDurationLabel(rental.duration)}`}
          onPress={() => onSelect(rental.id)}
          rentalIdLabel={`Mã thuê: ${shortenId(rental.id)}`}
          startTimeLabel={`Bắt đầu: ${getStartTimeLabel(rental.startTime)}`}
          stationLabel={`Trạm xuất phát: ${getStationName(rental.startStation)}`}
          statusText={getStatusText(rental.status)}
          statusTone={getStatusTone(rental.status)}
          title={rental.user?.fullname || "Khách hàng"}
        />
      ))}
    </YStack>
  );
}
