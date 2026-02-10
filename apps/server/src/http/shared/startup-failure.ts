import type { Exit } from "effect";

import { Cause, Match } from "effect";
import process from "node:process";

import logger from "@/lib/logger";

type PrismaInitErrorLike = {
  readonly _tag: "PrismaInitError";
  readonly reason?: string;
  readonly cause?: unknown;
};

type RedisInitErrorLike = {
  readonly _tag: "RedisInitError";
  readonly message?: string;
  readonly cause?: unknown;
};

type EmailInitErrorLike = {
  readonly _tag: "EmailInitError";
  readonly message?: string;
  readonly cause?: unknown;
};

function isTaggedError(tag: string) {
  return (value: unknown): value is { readonly _tag: string; readonly cause?: unknown } =>
    typeof value === "object"
    && value !== null
    && "_tag" in value
    && (value as { _tag?: unknown })._tag === tag;
}

function isPrismaInitError(value: unknown): value is PrismaInitErrorLike {
  return isTaggedError("PrismaInitError")(value);
}

function isRedisInitError(value: unknown): value is RedisInitErrorLike {
  return isTaggedError("RedisInitError")(value);
}

function isEmailInitError(value: unknown): value is EmailInitErrorLike {
  return isTaggedError("EmailInitError")(value);
}

export function handleStartupExit(exit: Exit.Exit<unknown, unknown>) {
  return Match.value(exit).pipe(
    Match.tag("Success", () => undefined),
    Match.tag("Failure", ({ cause }) => {
      const pretty = Cause.pretty(cause);
      const failure = Cause.failureOption(cause);

      return Match.value(failure).pipe(
        Match.tag("Some", ({ value }) =>
          Match.value(value).pipe(
            Match.when(isPrismaInitError, (err) => {
              logger.error(
                { err: err.cause },
                err.reason ?? "Failed to initialize Prisma",
              );
              process.exit(1);
            }),
            Match.when(isRedisInitError, (err) => {
              logger.error(
                { err: err.cause },
                err.message ?? "Failed to initialize Redis",
              );
              process.exit(1);
            }),
            Match.when(isEmailInitError, (err) => {
              logger.error(
                { err: err.cause },
                err.message ?? "Failed to initialize email transporter",
              );
              process.exit(1);
            }),
            Match.orElse(() => {
              logger.error({ err: pretty }, "Failed to start server");
              process.exit(1);
            }),
          )),
        Match.orElse(() => {
          logger.error({ err: pretty }, "Failed to start server");
          process.exit(1);
        }),
      );
    }),
    Match.exhaustive,
  );
}
