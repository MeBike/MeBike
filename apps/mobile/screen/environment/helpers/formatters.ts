import { formatSupportCode } from "@utils/id";

import type { EnvironmentImpactHistoryItem } from "@/contracts/server";

function formatNumber(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(1, maximumFractionDigits),
  }).format(value);
}

export function formatEnvironmentDate(value?: string) {
  if (!value) {
    return "--/--/----";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatCo2Saved(value: number) {
  return formatNumber(Math.round(value), 0);
}

export function formatDistanceKm(value: number) {
  return `${formatNumber(value, 1)} km`;
}

export function formatMinutes(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${Math.max(0, Math.round(value))} phút`;
}

export function formatConfidence(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${Math.round(value * 100)}%`;
}

export function getEnvironmentHistoryTitle(item: EnvironmentImpactHistoryItem) {
  return formatEnvironmentDate(item.calculated_at);
}

export function getEnvironmentHistorySubtitle(item: EnvironmentImpactHistoryItem) {
  const parts = [formatDistanceKm(item.estimated_distance_km)];

  if (typeof item.effective_ride_minutes === "number") {
    parts.push(formatMinutes(item.effective_ride_minutes));
  }

  return parts.join(" • ");
}

export function getEnvironmentRentalCode(rentalId: string) {
  return formatSupportCode(rentalId);
}
