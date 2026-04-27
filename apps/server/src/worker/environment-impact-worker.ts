import type { JobPayload } from "@mebike/shared/contracts/server/jobs";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";
import { Effect, Match } from "effect";

import type { QueueJob } from "@/infrastructure/jobs/ports";

import {
  EnvironmentImpactServiceTag,
} from "@/domain/environment";
import logger from "@/lib/logger";

import type { EffectRunner } from "./worker-runtime";

export function makeEnvironmentImpactCalculateRentalHandler(
  runEffect: EffectRunner<EnvironmentImpactServiceTag>,
) {
  return async function handleEnvironmentImpactCalculateRental(job: QueueJob | undefined): Promise<void> {
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

    const result = await runEffect(
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
  };
}
