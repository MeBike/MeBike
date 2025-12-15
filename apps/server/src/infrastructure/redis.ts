import type RedisClient from "ioredis";

import { Data, Effect, Schedule } from "effect";

import { makeRedisClient } from "@/lib/redis";

export class RedisInitError extends Data.TaggedError("RedisInitError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class Redis extends Effect.Service<Redis>()("Redis", {
  scoped: Effect.gen(function* () {
    const acquireWithRetry = Effect.tryPromise({
      try: async () => {
        const client = makeRedisClient();
        await Promise.race([
          client.ping(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Redis ping timeout")), 3000),
          ),
        ]);
        return client;
      },
      catch: cause =>
        new RedisInitError({
          message:
            "Failed to initialize Redis. Check REDIS_URL and that Redis is running (docker compose -f apps/server/compose.dev.yml up redis).",
          cause,
        }),
    }).pipe(
      Effect.retry(
        Schedule.exponential("500 millis").pipe(
          Schedule.jittered,
          Schedule.upTo("5 seconds"),
        ),
      ),
    );

    const client = yield* Effect.acquireRelease(
      acquireWithRetry,
      client => Effect.promise(() => client.quit()),
    );

    return { client } as const satisfies { client: RedisClient };
  }),
}) {}
