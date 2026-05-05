import type { BikeRow } from "@/domain/bikes";

import {
  bikeRentabilityLabels,
  formatLocalDateTime,
  getBikeRentabilityReason,
  getBikeStatusLabel,
} from "../shared/customer-tool-formatters";

export function toBikeAiDetail(bike: Pick<BikeRow, "id" | "bikeNumber" | "stationId" | "status" | "createdAt" | "updatedAt">) {
  const rentabilityReason = getBikeRentabilityReason(bike);

  return {
    createdAtDisplay: formatLocalDateTime(bike.createdAt),
    id: bike.id,
    bikeNumber: bike.bikeNumber,
    stationId: bike.stationId,
    status: bike.status,
    statusLabel: getBikeStatusLabel(bike.status),
    isRentable: rentabilityReason === "AVAILABLE",
    rentabilityReason,
    rentabilityLabel: bikeRentabilityLabels[rentabilityReason],
    createdAt: bike.createdAt.toISOString(),
    updatedAtDisplay: formatLocalDateTime(bike.updatedAt),
    updatedAt: bike.updatedAt.toISOString(),
  };
}
