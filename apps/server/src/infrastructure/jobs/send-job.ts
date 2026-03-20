import type { JobPayload, JobType } from "@mebike/shared/contracts/server/jobs";

import { JobPayloadSchemas } from "@mebike/shared/contracts/server/jobs";

import type { EnqueueJobOptions, JobProducer } from "./ports";

export async function sendJob<T extends JobType>(
  producer: JobProducer,
  type: T,
  payload: JobPayload<T>,
  options?: EnqueueJobOptions,
) {
  const parsedPayload = JobPayloadSchemas[type].parse(payload) as JobPayload<T>;
  return producer.send(type, parsedPayload, options);
}
