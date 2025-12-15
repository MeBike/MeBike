import { serve } from "@hono/node-server";
import { Effect } from "effect";
import process from "node:process";

import { Email } from "@/infrastructure/email";
import { Prisma } from "@/infrastructure/prisma";
import { Redis } from "@/infrastructure/redis";
import logger from "@/lib/logger";

import { createHttpApp } from "./app";

export const startHonoServer = Effect.gen(function* () {
  yield* Prisma;
  yield* Redis;
  yield* Email;
  const port = Number(process.env.PORT ?? 4000);
  serve({
    fetch: createHttpApp().fetch,
    port,
  });
  logger.info(`Server listening on http://localhost:${port} (docs at /docs)`);
}).pipe(
  Effect.provide(Email.Default),
  Effect.provide(Redis.Default),
  Effect.provide(Prisma.Default),
);
// mot khi gen thi provider prisma de pendency and reuds
