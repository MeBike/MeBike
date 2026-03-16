import type { DashboardTrend, RevenueDelta } from "../models";

export function compareRevenue(current: number, previous: number): RevenueDelta {
  const difference = current - previous;
  if (previous === 0) {
    return {
      current,
      previous,
      difference,
      percentChange: current > 0 ? 100 : 0,
    };
  }

  return {
    current,
    previous,
    difference,
    percentChange: (difference / previous) * 100,
  };
}

export function toTrend(current: number, previous: number): DashboardTrend {
  if (current > previous) {
    return "UP";
  }
  if (current < previous) {
    return "DOWN";
  }
  return "STABLE";
}

export function comparePercentage(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}
