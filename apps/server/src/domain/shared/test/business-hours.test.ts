import { describe, expect, it } from "vitest";

import {
  isWallClockWithinOvernightOperationsWindow,
  isWithinOvernightOperationsWindow,
  makeOvernightOperationsClosedError,
} from "../business-hours";

describe("overnight operations window", () => {
  it("treats 23:00 through 04:59 as closed in Vietnam time", () => {
    expect(isWithinOvernightOperationsWindow(new Date("2026-04-20T16:00:00.000Z"))).toBe(true);
    expect(isWithinOvernightOperationsWindow(new Date("2026-04-20T21:59:59.000Z"))).toBe(true);
    expect(isWithinOvernightOperationsWindow(new Date("2026-04-20T22:00:00.000Z"))).toBe(false);
  });

  it("treats fixed-slot wall-clock times the same way", () => {
    expect(isWallClockWithinOvernightOperationsWindow(new Date(Date.UTC(2000, 0, 1, 23, 0, 0)))).toBe(true);
    expect(isWallClockWithinOvernightOperationsWindow(new Date(Date.UTC(2000, 0, 1, 4, 59, 59)))).toBe(true);
    expect(isWallClockWithinOvernightOperationsWindow(new Date(Date.UTC(2000, 0, 1, 5, 0, 0)))).toBe(false);
  });

  it("reports overnight error currentTime in Vietnam local time", () => {
    const error = makeOvernightOperationsClosedError(new Date("2026-04-20T16:00:00.000Z"));

    expect(error.currentTime).toBe("2026-04-20T23:00:00+07:00");
    expect(error.timeZone).toBe("Asia/Ho_Chi_Minh");
  });
});
