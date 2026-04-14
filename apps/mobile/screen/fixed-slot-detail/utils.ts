import { BikeColors } from "@constants/BikeColors";

import type { FixedSlotStatus } from "@/contracts/server";

export const STATUS_STYLES: Record<FixedSlotStatus, { backgroundColor: string; color: string }> = {
  ACTIVE: { backgroundColor: "#E1F7E3", color: BikeColors.success },
  CANCELLED: { backgroundColor: "#FEE2E2", color: BikeColors.error },
};

export function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day)
    return value;

  return `${day}-${month}-${year}`;
}
