import { bikeStatusColors } from "@theme/index";

import type { BikeSummary } from "@/contracts/server";

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

export function formatBikeNumber(bikeNumber?: string | null, fallbackId?: string | null) {
  if (bikeNumber) {
    return bikeNumber;
  }

  if (!fallbackId) {
    return "--";
  }

  return `#${fallbackId.slice(-6)}`;
}

export function getBikeDisplayLabel(
  bike: { bikeNumber?: string | null; id?: string | null },
) {
  return formatBikeNumber(bike.bikeNumber, bike.id);
}

export function isBikeAvailable(status: BikeSummary["status"]) {
  return status === "AVAILABLE";
}

export function getBikeStatusColor(status: BikeSummary["status"]) {
  return bikeStatusColors[status];
}
