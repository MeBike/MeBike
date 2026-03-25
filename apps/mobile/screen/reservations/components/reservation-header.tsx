import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import React from "react";

import type { ReservationFilter } from "../hooks/use-reservations";

import { ReservationsFilter } from "./reservations-filter";

type ReservationHeaderProps = {
  canGoBack: boolean;
  onGoBack: () => void;
  filters: Array<{ key: ReservationFilter; label: string }>;
  activeFilter: ReservationFilter;
  onChangeFilter: (filter: ReservationFilter) => void;
};

export function ReservationHeader({
  canGoBack,
  onGoBack,
  filters,
  activeFilter,
  onChangeFilter,
}: ReservationHeaderProps) {
  return (
    <AppHeroHeader
      footer={(
        <ReservationsFilter
          activeFilter={activeFilter}
          filters={filters}
          onChange={onChangeFilter}
        />
      )}
      onBack={canGoBack ? onGoBack : undefined}
      title="Đặt trước của tôi"
    />
  );
}
