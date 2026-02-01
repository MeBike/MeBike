import { serve } from "@hono/node-server";
import { Effect, ManagedRuntime } from "effect";

import { env } from "@/config/env";
import { Email } from "@/infrastructure/email";
import { Prisma } from "@/infrastructure/prisma";
import { Redis } from "@/infrastructure/redis";
import logger from "@/lib/logger";

import { createHttpApp } from "./app";
import { HttpDepsLive } from "./shared/providers";

export const startHonoServer = Effect.gen(function* () {
  const httpRuntime = ManagedRuntime.make(HttpDepsLive);
  yield* Effect.promise(() =>
    httpRuntime.runPromise(Effect.gen(function* () {
      yield* Prisma;
      yield* Redis;
      yield* Email;
    })),
  );
  const port = env.PORT;
  serve({
    fetch: createHttpApp({
      runPromise: httpRuntime.runPromise.bind(httpRuntime),
    }).fetch,
    port,
  });
  logger.info(`Server listening on http://localhost:${port} (docs at /docs)`);
});
