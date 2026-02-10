import React from "react";

import InfoCard from "../components/InfoCard";
import InfoRow from "../components/InfoRow";

import type { RentalDetail } from "@/types/rental-types";

export function AdminBikeInfoCard({ booking }: { booking: RentalDetail }) {
  const bike = booking.bike;
  return (
    <InfoCard title="Thông tin xe" icon="bicycle">
      <InfoRow label="Mã xe:" value={bike?.id ?? "Không có dữ liệu"} />
      <InfoRow label="Chip:" value={bike?.chipId ? `Chip #${bike.chipId}` : "Chưa có"} />
      <InfoRow label="Trạm bắt đầu:" value={booking.startStation.name} />
      {booking.endStation ? (
        <>
          <InfoRow label="Trạm kết thúc:" value={booking.endStation.name} />
          <InfoRow label="Địa chỉ kết thúc:" value={booking.endStation.address} />
        </>
      ) : (
        <InfoRow label="Trạm kết thúc:" value="Xe chưa được trả" />
      )}
    </InfoCard>
  );
}
