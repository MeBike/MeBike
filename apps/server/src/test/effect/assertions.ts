import type { Either } from "effect";

import { Cause, Effect, Exit, Option } from "effect";
import { expect } from "vitest";

export function expectLeftTag<E extends { _tag: string }>(
  result: Either.Either<unknown, E>,
  tag: E["_tag"],
): E {
  if (result._tag !== "Left") {
    throw new Error(`Expected Left ${tag}, got Right`);
  }

  expect(result.left._tag).toBe(tag);
  return result.left;
}

export function expectRight<A>(
  result: Either.Either<A, { _tag: string }>,
): A {
  if (result._tag !== "Right") {
    throw new Error(`Expected Right, got ${result.left._tag}`);
  }

  return result.right;
}

type ErrorConstructor<E> = abstract new (...args: never[]) => E;

export async function expectDefect<E extends object, A, Err>(
  effect: Effect.Effect<A, Err, never>,
  errorConstructor: ErrorConstructor<E>,
  expected?: Partial<E>,
): Promise<E> {
  const result = await Effect.runPromiseExit(effect);

  expect(Exit.isFailure(result)).toBe(true);
  if (!Exit.isFailure(result)) {
    throw new Error("Expected effect to fail with defect");
  }

  expect(Cause.isDieType(result.cause)).toBe(true);
  const defect = Cause.dieOption(result.cause);
  expect(Option.isSome(defect)).toBe(true);
  if (Option.isNone(defect)) {
    throw new Error("Expected defect cause");
  }

  expect(defect.value).toBeInstanceOf(errorConstructor);
  if (expected != null) {
    expect(defect.value).toMatchObject(expected);
  }

  return defect.value as E;
}
