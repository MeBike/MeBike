import { Cause, Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";

import type { UserNotFound } from "./effect-option";

import { getUserOrFail } from "./effect-option";

describe("examples/effect-option", () => {
  it("returns user when Option is Some", async () => {
    const user = await Effect.runPromise(getUserOrFail("u2"));
    expect(user).toEqual({ id: "u2", name: "Binh" });
  });

  it("fails with UserNotFound when Option is None", async () => {
    const exit = await Effect.runPromiseExit(getUserOrFail("missing"));
    expect(Exit.isFailure(exit)).toBe(true);

    if (!Exit.isFailure(exit)) {
      throw new Error("expected failure");
    }

    const cause = exit.cause;
    expect(Cause.isFailType(cause)).toBe(true);

    if (!Cause.isFailType(cause)) {
      throw new Error("expected Fail cause");
    }

    const err = cause.error as UserNotFound;
    expect(err._tag).toBe("UserNotFound");
    expect(err.userId).toBe("missing");
  });
});
