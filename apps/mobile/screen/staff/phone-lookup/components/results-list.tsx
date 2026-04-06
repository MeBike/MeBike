import React from "react";
import { YStack } from "tamagui";

import type { RentalListItem } from "@/types/rental-types";

import { ResultCard } from "./result-card";

type ResultsListProps = {
  rentals: RentalListItem[];
  getStationName: (id: string) => string;
  getStatusTone: (status: string) => "success" | "warning" | "danger" | "neutral";
  getStatusText: (status: string) => string;
  onSelect: (id: string) => void;
};

export function ResultsList({
  rentals,
  getStationName,
  getStatusTone,
  getStatusText,
  onSelect,
}: ResultsListProps) {
  return (
    <YStack gap="$4">
      {rentals.map(rental => (
        <ResultCard
          key={rental.id}
          onSelect={onSelect}
          rentalId={rental.id}
          stationLabel={getStationName(rental.startStation)}
          statusText={getStatusText(rental.status)}
          statusTone={getStatusTone(rental.status)}
          title={rental.user?.fullname || "Khách hàng"}
        />
      ))}
    </YStack>
  );
}
