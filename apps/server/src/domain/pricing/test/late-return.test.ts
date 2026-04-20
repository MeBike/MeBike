import { describe, expect, it } from "vitest";

import {
  isAfterLateReturnCutoff,
  isPastRentalReturnDeadline,
} from "../late-return";

describe("late return cutoff", () => {
  const cutoff = new Date("1970-01-01T23:00:00.000Z");

  it("treats exactly 23:00:00 local time as on-time", () => {
    const confirmedAt = new Date("2026-03-22T16:00:00.000Z");

    expect(isAfterLateReturnCutoff(confirmedAt, cutoff)).toBe(false);
  });

  it("treats times after 23:00:00 local time as late", () => {
    const confirmedAt = new Date("2026-03-22T16:00:01.000Z");

    expect(isAfterLateReturnCutoff(confirmedAt, cutoff)).toBe(true);
  });

  it("treats times before 23:00:00 local time as on-time", () => {
    const confirmedAt = new Date("2026-03-22T15:59:59.000Z");

    expect(isAfterLateReturnCutoff(confirmedAt, cutoff)).toBe(false);
  });

  it("treats next-day returns as overdue", () => {
    const rentalStartTime = new Date("2026-03-22T10:00:00.000Z");
    const referenceTime = new Date("2026-03-23T00:05:00.000Z");

    expect(isPastRentalReturnDeadline(rentalStartTime, referenceTime, cutoff)).toBe(true);
  });
});
