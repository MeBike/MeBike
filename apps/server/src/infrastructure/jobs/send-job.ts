import type { JobPayload, JobType } from "@mebike/shared/contracts/server/jobs";
import type { PgBoss } from "pg-boss";

import { JobPayloadSchemas } from "@mebike/shared/contracts/server/jobs";

type SendOptions = Parameters<PgBoss["send"]>[2];

export async function sendJob<T extends JobType>(
  boss: PgBoss,
  type: T,
  payload: JobPayload<T>,
  options?: SendOptions,
) {
  const parsedPayload = JobPayloadSchemas[type].parse(payload) as JobPayload<T>;
  return boss.send(type, parsedPayload, options);
}
