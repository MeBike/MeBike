import type { MongoDecimal } from "@/types/money";

export function parseDecimal(value: MongoDecimal): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object" && "$numberDecimal" in value) {
    const parsed = Number(value.$numberDecimal);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
