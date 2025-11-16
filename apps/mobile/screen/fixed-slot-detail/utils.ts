import { BikeColors } from "@constants/BikeColors";

export const STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  "ĐANG HOẠT ĐỘNG": { backgroundColor: "#E1F7E3", color: BikeColors.success },
  "ĐÃ HUỶ": { backgroundColor: "#FEE2E2", color: BikeColors.error },
};

export function formatDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return value;
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
