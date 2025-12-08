import { describe, expect, it } from "vitest";

import { add, clamp } from "../src";

describe("math helpers", () => {
  it("adds numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("clamps within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it("throws when min > max", () => {
    expect(() => clamp(1, 10, 5)).toThrow("min cannot be greater than max");
  });
});
