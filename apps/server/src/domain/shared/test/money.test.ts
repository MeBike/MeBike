import { describe, expect, it } from "vitest";

import { Prisma } from "generated/prisma/client";

import { toMinorUnit } from "../money";

describe("toMinorUnit", () => {
  it("returns fallback for null/undefined", () => {
    expect(toMinorUnit(undefined)).toBe(0n);
    expect(toMinorUnit(null, 5n)).toBe(5n);
  });

  it("accepts bigint and integer number", () => {
    expect(toMinorUnit(123n)).toBe(123n);
    expect(toMinorUnit(42)).toBe(42n);
  });

  it("rejects non-integer number", () => {
    expect(() => toMinorUnit(1.5)).toThrow();
  });

  it("accepts integer strings and zero-decimal strings", () => {
    expect(toMinorUnit("100")).toBe(100n);
    expect(toMinorUnit("100.0")).toBe(100n);
    expect(toMinorUnit("100.00")).toBe(100n);
  });

  it("rejects strings with non-zero fractional part", () => {
    expect(() => toMinorUnit("10.5")).toThrow();
    expect(() => toMinorUnit("10.01")).toThrow();
  });

  it("accepts Prisma Decimal with zero fractional part", () => {
    const dec = new Prisma.Decimal("250.00");
    expect(toMinorUnit(dec)).toBe(250n);
  });

  it("rejects Prisma Decimal with fractional part", () => {
    const dec = new Prisma.Decimal("250.50");
    expect(() => toMinorUnit(dec)).toThrow();
  });
});
