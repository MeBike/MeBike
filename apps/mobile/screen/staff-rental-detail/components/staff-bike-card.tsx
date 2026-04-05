import { getBikeChipDisplay, getBikeStatusLabel } from "@utils/bike";
import { formatSupportCode } from "@utils/id";

import type { RentalDetail } from "@/types/rental-types";

import { StaffDetailField } from "./staff-detail-field";
import { StaffSectionCard } from "./staff-section-card";

type StaffBikeCardProps = {
  booking: RentalDetail;
};

export function StaffBikeCard({ booking }: StaffBikeCardProps) {
  return (
    <StaffSectionCard iconName="bicycle" title="Thông tin xe">
      <StaffDetailField label="Mã xe" value={formatSupportCode(booking.bike.id)} />
      <StaffDetailField label="Chip" value={getBikeChipDisplay(booking.bike)} />
      <StaffDetailField label="Trạng thái xe" value={getBikeStatusLabel(booking.bike.status)} />
      <StaffDetailField label="Trạm bắt đầu" value={booking.startStation.name} withSeparator={false} />
    </StaffSectionCard>
  );
}
