import type { RentalDetail } from "@/types/rental-types";

import { RentalJourneyView } from "../../booking-history-detail/components/rental-journey-card";
import { formatTimeOnly } from "../../booking-history-detail/helpers/formatters";

type StaffJourneyCardProps = {
  booking: RentalDetail;
};

export function StaffJourneyCard({ booking }: StaffJourneyCardProps) {
  const isOngoing = booking.status === "RENTED";
  const hasReturnSlot = isOngoing && Boolean(booking.returnSlot);

  return (
    <RentalJourneyView
      endStationLabel={isOngoing
        ? hasReturnSlot
          ? booking.returnSlot?.station.name ?? "Bãi trả đã chọn"
          : "Chưa chọn bãi trả"
        : (booking.endStation?.name ?? "Không xác định")}
      endTimeText={isOngoing
        ? hasReturnSlot
          ? `Giữ chỗ từ ${formatTimeOnly(booking.returnSlot?.reservedFrom)}`
          : undefined
        : formatTimeOnly(booking.endTime)}
      hasReturnSlot={hasReturnSlot}
      isOngoing={isOngoing}
      missingReturnSlotHelperText="Khách chưa chọn bãi trả xe cho phiên này."
      missingReturnSlotLabel="Trạm trả xe"
      reservedReturnStationLabel="Trạm trả xe"
      showBikeSwapSection={false}
      startStationLabel={booking.startStation.name}
      startTimeText={formatTimeOnly(booking.startTime)}
    />
  );
}
