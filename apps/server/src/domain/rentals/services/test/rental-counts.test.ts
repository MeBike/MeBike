import { describe, expect, it } from "vitest";

import type { RentalCountsRow } from "../../models";

import { aggregateRentalStatusCounts } from "../rental-counts";

describe("aggregateRentalStatusCounts", () => {
  it("fills missing statuses with zeros", () => {
    const rows: RentalCountsRow[] = [
      { status: "RENTED", count: 2 },
      { status: "COMPLETED", count: 5 },
    ];

    expect(aggregateRentalStatusCounts(rows)).toEqual({
      RENTED: 2,
      COMPLETED: 5,
      CANCELLED: 0,
      RESERVED: 0,
    });
  });

  it("overwrites counts per status", () => {
    const rows: RentalCountsRow[] = [
      { status: "RENTED", count: 1 },
      { status: "RENTED", count: 3 },
      { status: "CANCELLED", count: 4 },
    ];

    expect(aggregateRentalStatusCounts(rows)).toEqual({
      RENTED: 3,
      COMPLETED: 0,
      CANCELLED: 4,
      RESERVED: 0,
    });
  });
});

