import type { BikeSummary } from "@/contracts/server";

import { bikeStatusColors } from "@theme/index";

const BIKE_STATUS_LABELS: Record<BikeSummary["status"], string> = {
  AVAILABLE: "Có sẵn",
  BOOKED: "Đang được thuê",
  BROKEN: "Bị hỏng",
  RESERVED: "Đã đặt trước",
  MAINTAINED: "Đang bảo trì",
  UNAVAILABLE: "Không có sẵn",
};

export function getBikeStatusLabel(status: BikeSummary["status"]) {
  return BIKE_STATUS_LABELS[status];
}

export function getBikeChipDisplay(bike: Pick<BikeSummary, "chipId" | "id">) {
  return bike.chipId
    ? `#${bike.chipId.slice(-6)}`
    : `#${bike.id.slice(-6)}`;
}

export function isBikeAvailable(status: BikeSummary["status"]) {
  return status === "AVAILABLE";
}

export function getBikeStatusColor(status: BikeSummary["status"]) {
  return bikeStatusColors[status];
}
