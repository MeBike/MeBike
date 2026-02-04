import { serve } from "@hono/node-server";
import { Effect, ManagedRuntime } from "effect";

import { env } from "@/config/env";
import { Email } from "@/infrastructure/email";
import { Prisma } from "@/infrastructure/prisma";
import { Redis } from "@/infrastructure/redis";
import logger from "@/lib/logger";
import { startBikeStatusListener } from "@/realtime/pg-bike-status-listener";

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
  yield* Effect.promise(() => startBikeStatusListener());
  const port = env.PORT;
  serve({
    fetch: createHttpApp({
      runPromise: httpRuntime.runPromise.bind(httpRuntime),
    }).fetch,
    port,
    hostname: "0.0.0.0",
  });
  logger.info(`Server listening on http://0.0.0.0:${port} (docs at /docs)`);
});
