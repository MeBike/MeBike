import { Data, Effect, Layer } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { makePrismaClient } from "@/lib/prisma";

export class PrismaInitError extends Data.TaggedError("PrismaInitError")<{
  readonly reason: string;
  readonly cause?: unknown;
}> {}

const makePrisma = Effect.gen(function* () {
  const client = yield* Effect.acquireRelease(
    Effect.tryPromise({
      try: async () => {
        const client = makePrismaClient();
        await client.$connect();
        await client.$queryRaw`SELECT 1`;
        return client;
      },
      catch: cause =>
        new PrismaInitError({
          reason:
            "Failed to initialize Prisma. Check DATABASE_URL and that Postgres is running (docker compose -f apps/server/compose.dev.yml up db).",
          cause,
        }),
    }),
    client => Effect.promise(() => client.$disconnect()),
  );

  return { client } as const satisfies { client: PrismaClient };
});

export class Prisma extends Effect.Service<Prisma>()("Prisma", {
  scoped: makePrisma,
}) {}

export const PrismaLive = Layer.scoped(
  Prisma,
  makePrisma.pipe(Effect.map(Prisma.make)),
);
