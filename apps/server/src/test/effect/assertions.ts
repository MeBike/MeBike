import type { Either } from "effect";

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
