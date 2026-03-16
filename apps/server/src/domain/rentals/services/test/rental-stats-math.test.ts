import { describe, expect, it } from "vitest";

import {
  comparePercentage,
  compareRevenue,
  toTrend,
} from "../rental-stats-math";

describe("compareRevenue", () => {
  it("returns zero percent change when both values are zero", () => {
    expect(compareRevenue(0, 0)).toEqual({
      current: 0,
      previous: 0,
      difference: 0,
      percentChange: 0,
    });
  });

  it("returns 100 percent change when previous is zero and current is positive", () => {
    expect(compareRevenue(250, 0)).toEqual({
      current: 250,
      previous: 0,
      difference: 250,
      percentChange: 100,
    });
  });

  it("computes percent change for normal increase and decrease", () => {
    expect(compareRevenue(120, 100)).toEqual({
      current: 120,
      previous: 100,
      difference: 20,
      percentChange: 20,
    });

    expect(compareRevenue(80, 100)).toEqual({
      current: 80,
      previous: 100,
      difference: -20,
      percentChange: -20,
    });
  });
});

describe("comparePercentage", () => {
  it("returns zero when both values are zero", () => {
    expect(comparePercentage(0, 0)).toBe(0);
  });

  it("returns 100 when previous is zero and current is positive", () => {
    expect(comparePercentage(10, 0)).toBe(100);
  });

  it("returns expected percentage for common cases", () => {
    expect(comparePercentage(150, 100)).toBe(50);
    expect(comparePercentage(50, 100)).toBe(-50);
  });
});

describe("toTrend", () => {
  it("returns UP when current is greater than previous", () => {
    expect(toTrend(2, 1)).toBe("UP");
  });

  it("returns DOWN when current is lower than previous", () => {
    expect(toTrend(1, 2)).toBe("DOWN");
  });

  it("returns STABLE when values are equal", () => {
    expect(toTrend(2, 2)).toBe("STABLE");
  });
});
