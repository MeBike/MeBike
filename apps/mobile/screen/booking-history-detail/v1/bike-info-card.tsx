import React from "react";
import { formatSupportCode, shortenId } from "@utils/id";

import type { Bike } from "@/types/BikeTypes";
import type { Rental } from "@/types/rental-types";
import type { StationType } from "@/types/StationType";

import InfoCard from "../components/InfoCard";
import InfoRow from "../components/InfoRow";

export function RentalBikeInfoCard({
  rental,
  stationsById,
  bike,
}: {
  rental: Rental;
  stationsById: Map<string, StationType>;
  bike?: Bike;
}) {
  const startStation = stationsById.get(rental.startStation);
  const endStation = rental.endStation ? stationsById.get(rental.endStation) : undefined;

  const bikeDisplayId = rental.bikeId
    ? formatSupportCode(rental.bikeId)
    : "Không có dữ liệu";
  const chipDisplayId = bike?.chip_id
    ? `#${shortenId(bike.chip_id, { head: 6, tail: 5 })}`
    : "Chưa có";
  const startStationLabel = startStation?.name ?? formatSupportCode(rental.startStation);
  const endStationLabel = rental.endStation
    ? (endStation?.name ?? formatSupportCode(rental.endStation))
    : "Xe chưa được trả";

  return (
    <InfoCard title="Thông tin xe" icon="bicycle">
      <InfoRow label="Mã xe:" value={bikeDisplayId} />
      <InfoRow
        label="Chip:"
        value={chipDisplayId}
      />
      <InfoRow
        label="Trạm bắt đầu:"
        value={startStationLabel}
      />
      <InfoRow
        label="Trạm kết thúc:"
        value={endStationLabel}
      />
      {endStation?.address
        ? <InfoRow label="Địa chỉ kết thúc:" value={endStation.address} />
        : null}
    </InfoCard>
  );
}
