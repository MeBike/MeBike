import type { JobPayload } from "@mebike/shared/contracts/server/jobs";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";

import type { QueueJob } from "@/infrastructure/jobs/ports";

import {
  ExpoPushSenderServiceLive,
  ExpoPushSenderServiceTag,
  PushTokenRepository,
  PushTokenRepositoryLive,
} from "@/domain/notifications";
import { PrismaLive } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

type PushWorkerResult = {
  readonly tokenCount: number;
  readonly acceptedCount: number;
  readonly invalidCount: number;
  readonly unregisteredCount: number;
  readonly errorCount: number;
};

function runPushEffect<A, E>(
  eff: Effect.Effect<A, E, PushTokenRepository | ExpoPushSenderServiceTag>,
) {
  return Effect.runPromise(
    eff.pipe(
      Effect.provide(ExpoPushSenderServiceLive),
      Effect.provide(PushTokenRepositoryLive),
      Effect.provide(PrismaLive),
    ),
  );
}

export async function handlePushSend(job: QueueJob | undefined): Promise<void> {
  if (!job) {
    logger.warn("Push worker received empty batch");
    return;
  }

  let payload: JobPayload<typeof JobTypes.PushSend>;
  try {
    payload = parseJobPayload(JobTypes.PushSend, job.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Invalid push payload");
    throw err;
  }

  const result = await runPushEffect(
    Effect.gen(function* () {
      const repo = yield* PushTokenRepository;
      const sender = yield* ExpoPushSenderServiceTag;

      const tokens = yield* repo.listActiveByUserId(payload.userId).pipe(
        Effect.catchTag("PushTokenRepositoryError", err => Effect.die(err)),
      );
      if (tokens.length === 0) {
        return {
          tokenCount: 0,
          acceptedCount: 0,
          invalidCount: 0,
          unregisteredCount: 0,
          errorCount: 0,
        } satisfies PushWorkerResult;
      }

      const outcomes = yield* sender.sendMany(
        tokens.map(token => ({
          token: token.token,
          title: payload.title,
          body: payload.body,
          channelId: payload.channelId,
          data: payload.data,
        })),
      ).pipe(
        Effect.catchTag("PushProviderError", (err) => {
          logger.error(
            { err, jobId: job.id, userId: payload.userId, event: payload.event },
            "Push provider sendMany failed",
          );
          return Effect.succeed([]);
        }),
      );

      let acceptedCount = 0;
      let invalidCount = 0;
      let unregisteredCount = 0;
      let errorCount = 0;

      for (const outcome of outcomes) {
        if (outcome.status === "ok") {
          acceptedCount += 1;
          continue;
        }

        if (outcome.status === "invalid_token" || outcome.status === "device_not_registered") {
          if (outcome.status === "invalid_token") {
            invalidCount += 1;
          }
          else {
            unregisteredCount += 1;
          }

          yield* repo.deactivateForUser(payload.userId, outcome.token).pipe(
            Effect.catchTag("PushTokenRepositoryError", err => Effect.die(err)),
          );
          continue;
        }

        errorCount += 1;
      }

      return {
        tokenCount: tokens.length,
        acceptedCount,
        invalidCount,
        unregisteredCount,
        errorCount,
      } satisfies PushWorkerResult;
    }),
  );

  logger.info(
    { jobId: job.id, userId: payload.userId, event: payload.event, result },
    "notifications.push.send processed",
  );
}
