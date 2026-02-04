import React from "react";

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

  return (
    <InfoCard title="Thông tin xe" icon="bicycle">
      <InfoRow label="Mã xe:" value={rental.bikeId ?? "Không có dữ liệu"} />
      <InfoRow
        label="Chip:"
        value={bike?.chip_id ? `Chip #${bike.chip_id}` : "Chưa có"}
      />
      <InfoRow
        label="Trạm bắt đầu:"
        value={startStation?.name ?? rental.startStation}
      />
      {rental.endStation
        ? (
            <>
              <InfoRow
                label="Trạm kết thúc:"
                value={endStation?.name ?? rental.endStation}
              />
              {endStation?.address && (
                <InfoRow label="Địa chỉ kết thúc:" value={endStation.address} />
              )}
            </>
          )
        : (
            <InfoRow label="Trạm kết thúc:" value="Xe chưa được trả" />
          )}
    </InfoCard>
  );
}
