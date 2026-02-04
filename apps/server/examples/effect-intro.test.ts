import { Cause, Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";

import type { NameRequired } from "./effect-intro";

import { greetProgram } from "./effect-intro";

describe("examples/effect-intro", () => {
  it("greets a valid name", async () => {
    const message = await Effect.runPromise(greetProgram("Ada"));
    expect(message).toBe("Xin chào, Ada!");
  });

  it("fails with a typed tagged error", async () => {
    const exit = await Effect.runPromiseExit(greetProgram(""));
    expect(Exit.isFailure(exit)).toBe(true);

    if (!Exit.isFailure(exit)) {
      throw new Error("expected failure");
    }

    const cause = exit.cause;
    expect(Cause.isFailType(cause)).toBe(true);

    if (!Cause.isFailType(cause)) {
      throw new Error("expected Fail cause");
    }

    const err = cause.error as NameRequired;
    expect(err._tag).toBe("NameRequired");
    expect(err.field).toBe("name");
  });
});
