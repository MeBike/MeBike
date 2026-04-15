import type { JobPayload } from "@mebike/shared/contracts/server/jobs";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Layer, Match } from "effect";

import type { QueueJob } from "@/infrastructure/jobs/ports";

import {
  EnvironmentImpactRepositoryLive,
  EnvironmentImpactServiceLive,
  EnvironmentImpactServiceTag,
  EnvironmentPolicyRepositoryLive,
  EnvironmentPolicyServiceLive,
} from "@/domain/environment";
import { PrismaLive } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

const EnvironmentPolicyReposLive = EnvironmentPolicyRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const EnvironmentImpactReposLive = EnvironmentImpactRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const EnvironmentPolicyServiceLayer = EnvironmentPolicyServiceLive.pipe(
  Layer.provide(EnvironmentPolicyReposLive),
);

const EnvironmentImpactServiceLayer = EnvironmentImpactServiceLive.pipe(
  Layer.provide(EnvironmentImpactReposLive),
  Layer.provide(EnvironmentPolicyServiceLayer),
);

const EnvironmentImpactWorkerLive = Layer.mergeAll(
  EnvironmentPolicyReposLive,
  EnvironmentImpactReposLive,
  EnvironmentPolicyServiceLayer,
  EnvironmentImpactServiceLayer,
  PrismaLive,
);

type EnvironmentImpactWorkerEnv = Layer.Layer.Success<typeof EnvironmentImpactWorkerLive>;

function runEnvironmentImpactEffect<A, E>(
  eff: Effect.Effect<A, E, EnvironmentImpactWorkerEnv>,
): Promise<A> {
  return Effect.runPromise(eff.pipe(Effect.provide(EnvironmentImpactWorkerLive)));
}

export async function handleEnvironmentImpactCalculateRental(
  job: QueueJob | undefined,
): Promise<void> {
  if (!job) {
    logger.warn("Environment impact worker received empty batch");
    return;
  }

  let payload: JobPayload<typeof JobTypes.EnvironmentImpactCalculateRental>;
  try {
    payload = parseJobPayload(JobTypes.EnvironmentImpactCalculateRental, job.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Invalid environment impact payload");
    throw err;
  }

  const result = await runEnvironmentImpactEffect(
    Effect.gen(function* () {
      const service = yield* EnvironmentImpactServiceTag;
      return yield* service.calculateFromRental(payload.rentalId);
    }).pipe(Effect.either),
  );

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      logger.info(
        {
          jobId: job.id,
          rentalId: payload.rentalId,
          impactId: right.impact.id,
          alreadyCalculated: right.alreadyCalculated,
        },
        "environment.impact.calculateRental completed",
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("ActiveEnvironmentPolicyNotFound", () => {
          logger.error(
            { jobId: job.id, rentalId: payload.rentalId },
            "No active environment policy found",
          );
          throw left;
        }),
        Match.orElse(() => {
          logger.error(
            { jobId: job.id, rentalId: payload.rentalId, error: left },
            "environment.impact.calculateRental failed",
          );
          throw left;
        }),
      )),
    Match.exhaustive,
  );
}
