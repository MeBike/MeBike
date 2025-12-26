import { serve } from "@hono/node-server";
import { Effect } from "effect";

import { env } from "@/config/env";
import { Email, EmailLive } from "@/infrastructure/email";
import { Prisma, PrismaLive } from "@/infrastructure/prisma";
import { Redis, RedisLive } from "@/infrastructure/redis";
import logger from "@/lib/logger";

import { createHttpApp } from "./app";

export const startHonoServer = Effect.gen(function* () {
  yield* Prisma;
  yield* Redis;
  yield* Email;
  const port = env.PORT;
  serve({
    fetch: createHttpApp().fetch,
    port,
  });
  logger.info(`Server listening on http://localhost:${port} (docs at /docs)`);
}).pipe(
  Effect.provide(EmailLive),
  Effect.provide(RedisLive),
  Effect.provide(PrismaLive),
);
// mot khi gen thi provider prisma de pendency and reuds
