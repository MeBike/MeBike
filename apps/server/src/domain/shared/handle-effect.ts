import { Effect } from "effect";

import logger from "@/lib/logger";

export function withLoggedCause<A, E, R>(
  eff: Effect.Effect<A, E, R>,
  context: string,
): Effect.Effect<A, E, R> {
  return eff.pipe(
    Effect.tapErrorCause(cause =>
      Effect.sync(() => {
        logger.error("Effect failure", { context, cause });
      }),
    ),
  );
}
