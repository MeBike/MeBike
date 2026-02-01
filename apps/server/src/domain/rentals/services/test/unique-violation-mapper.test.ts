import { Option } from "effect";
import { describe, expect, it } from "vitest";

import { rentalUniqueViolationToFailure } from "../unique-violation-mapper";

describe("rentalUniqueViolationToFailure", () => {
  const base = {
    bikeId: "bike-1",
    userId: "user-1",
  } as const;

  it("maps bike unique constraint by index name", () => {
    const result = rentalUniqueViolationToFailure({
      ...base,
      constraint: ["idx_rentals_active_bike"],
    });
    expect(Option.isSome(result)).toBe(true);
    if (Option.isSome(result)) {
      expect(result.value._tag).toBe("BikeAlreadyRented");
    }
  });

  it("maps bike unique constraint by column name", () => {
    const result = rentalUniqueViolationToFailure({
      ...base,
      constraint: ["bike_id"],
    });
    expect(Option.isSome(result)).toBe(true);
    if (Option.isSome(result)) {
      expect(result.value._tag).toBe("BikeAlreadyRented");
    }
  });

  it("maps user unique constraint by index name", () => {
    const result = rentalUniqueViolationToFailure({
      ...base,
      constraint: ["idx_rentals_active_user"],
    });
    expect(Option.isSome(result)).toBe(true);
    if (Option.isSome(result)) {
      expect(result.value._tag).toBe("ActiveRentalExists");
    }
  });

  it("maps user unique constraint by column name", () => {
    const result = rentalUniqueViolationToFailure({
      ...base,
      constraint: ["user_id"],
    });
    expect(Option.isSome(result)).toBe(true);
    if (Option.isSome(result)) {
      expect(result.value._tag).toBe("ActiveRentalExists");
    }
  });

  it("returns none for unknown constraints", () => {
    const result = rentalUniqueViolationToFailure({
      ...base,
      constraint: ["some_other_index"],
    });
    expect(Option.isNone(result)).toBe(true);
  });
});
