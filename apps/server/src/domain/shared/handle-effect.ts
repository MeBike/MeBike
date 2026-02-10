import { Cause, Effect, Option } from "effect";

import logger from "@/lib/logger";

export function withLoggedCause<A, E, R>(
  eff: Effect.Effect<A, E, R>,
  context: string,
): Effect.Effect<A, E, R> {
  return eff.pipe(
    Effect.tapErrorCause(cause =>
      Effect.sync(() => {
        const failure = Cause.failureOption(cause);
        logger.error({
          context,
          cause: Cause.pretty(cause),
          ...(Option.isSome(failure) ? { err: failure.value } : {}),
        }, "Effect failure");
      }),
    ),
  );
}
