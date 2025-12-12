import type { Context } from "hono";

import { Console, Effect, Exit } from "effect";

import { makeServerErrorResponse } from "@/http/shared/error-response";

type ErrorHandler<E> = (c: Context, e: E) => Response;
export async function handleEffect<A, E>(
  c: Context,
  eff: Effect.Effect<A, E, never>,
  onError: ErrorHandler<E>,
  onSuccess: (c: Context, a: A) => Response,
): Promise<Response> {
  const exit = await Effect.runPromiseExit(eff);
  if (Exit.isSuccess(exit)) {
    return onSuccess(c, exit.value);
  }
  const cause = exit.cause;
  if (cause._tag === "Fail") {
    return onError(c, cause.error);
  }
  Console.info("Unhandled error in handleEffect:", cause);
  return c.json(makeServerErrorResponse("Internal Server Error"), 500);
}
