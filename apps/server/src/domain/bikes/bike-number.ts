const BIKE_NUMBER_PREFIX = "MB";
const BIKE_NUMBER_WIDTH = 6;

export function formatBikeNumber(value: number): string {
  return `${BIKE_NUMBER_PREFIX}-${String(value).padStart(BIKE_NUMBER_WIDTH, "0")}`;
}
