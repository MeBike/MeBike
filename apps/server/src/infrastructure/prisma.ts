import { Data, Effect } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { makePrismaClient } from "@/lib/prisma";

export class PrismaInitError extends Data.TaggedError("PrismaInitError")<{
  readonly reason: string;
  readonly cause?: unknown;
}> {}

export class Prisma extends Effect.Service<Prisma>()("Prisma", {
  scoped: Effect.gen(function* () {
    const client = yield* Effect.acquireRelease(
      Effect.try({
        try: () => makePrismaClient(),
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
  }),
}) {}
