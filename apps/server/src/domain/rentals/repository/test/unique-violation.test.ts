import { describe, expect, it } from "vitest";

import {
  isActiveReturnSlotByRentalTarget,
  isKnownReturnSlotUniqueConstraint,
} from "../unique-violation";

describe("return slot unique violation helpers", () => {
  it("matches the active return-slot index name", () => {
    expect(isActiveReturnSlotByRentalTarget("idx_return_slot_reservations_active_rental")).toBe(true);
  });

  it("matches snake_case rental column names", () => {
    expect(isActiveReturnSlotByRentalTarget("rental_id")).toBe(true);
  });

  it("matches camelCase rental field names", () => {
    expect(isActiveReturnSlotByRentalTarget("rentalId")).toBe(true);
  });

  it("returns false for unrelated targets", () => {
    expect(isActiveReturnSlotByRentalTarget("station_id")).toBe(false);
    expect(isActiveReturnSlotByRentalTarget("idx_return_slot_reservations_station_time")).toBe(false);
  });

  it("accepts known constraints in array form", () => {
    expect(isKnownReturnSlotUniqueConstraint(["idx_return_slot_reservations_active_rental"]))
      .toBe(true);
    expect(isKnownReturnSlotUniqueConstraint(["rental_id"]))
      .toBe(true);
  });

  it("rejects unknown constraints", () => {
    expect(isKnownReturnSlotUniqueConstraint(["station_id", "reserved_from"])).toBe(false);
    expect(isKnownReturnSlotUniqueConstraint(["some_other_unique_index"])).toBe(false);
    expect(isKnownReturnSlotUniqueConstraint(undefined)).toBe(false);
  });
});
