import { describe, expect, it } from "vitest";

import {
  buildFixedSlotLabels,
  normalizeSlotDate,
  parseSlotDateKey,
  parseSlotTimeValue,
  toSlotDateKey,
} from "../fixed-slot/fixed-slot.helpers";

describe("fixed-slot helper timezone behavior", () => {
  it("keeps slot date tokens stable at UTC midnight for storage", () => {
    const slotDate = parseSlotDateKey("2026-04-20");

    expect(slotDate.toISOString()).toBe("2026-04-20T00:00:00.000Z");
    expect(toSlotDateKey(slotDate)).toBe("2026-04-20");
  });

  it("builds slot start timestamps from Vietnam local date and time", () => {
    const slotDate = parseSlotDateKey("2026-04-20");
    const slotStart = parseSlotTimeValue("09:30");
    const labels = buildFixedSlotLabels(slotDate, slotStart);

    expect(labels.slotStartAt.toISOString()).toBe("2026-04-20T02:30:00.000Z");
    expect(labels.slotDateLabel).toBe("20/04/2026");
    expect(labels.slotTimeLabel).toBe("09:30");
  });

  it("normalizes current time to Vietnam business day token", () => {
    const nowAtVietnam0100 = new Date("2026-04-19T18:00:00.000Z");

    expect(normalizeSlotDate(nowAtVietnam0100).toISOString()).toBe("2026-04-20T00:00:00.000Z");
  });

  it("makes a Vietnam-today slot compare as today, not future", () => {
    const nowAtVietnam0100 = new Date("2026-04-19T18:00:00.000Z");
    const normalizedToday = normalizeSlotDate(nowAtVietnam0100);
    const slotDate = parseSlotDateKey("2026-04-20");

    expect(toSlotDateKey(normalizedToday)).toBe("2026-04-20");
    expect(toSlotDateKey(slotDate)).toBe("2026-04-20");
    expect(slotDate.getTime()).toBe(normalizedToday.getTime());
  });
});
