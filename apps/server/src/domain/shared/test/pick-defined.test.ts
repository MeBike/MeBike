import { describe, expect, it } from "vitest";

import { pickDefined } from "../pick-defined";

describe("pickDefined", () => {
  it("removes keys with undefined values", () => {
    expect(pickDefined({ a: 1, b: undefined, c: "x" })).toEqual({ a: 1, c: "x" });
  });

  it("preserves null values (PATCH clear-field semantics)", () => {
    expect(pickDefined({ a: null, b: undefined })).toEqual({ a: null });
  });

  it("preserves falsy values", () => {
    expect(pickDefined({ a: "", b: 0, c: false, d: undefined })).toEqual({
      a: "",
      b: 0,
      c: false,
    });
  });

  it("does not mutate input", () => {
    const input: { a: number; b?: number } = { a: 1, b: undefined };
    const out = pickDefined(input);
    expect(input).toEqual({ a: 1, b: undefined });
    expect(out).toEqual({ a: 1 });
  });
});
