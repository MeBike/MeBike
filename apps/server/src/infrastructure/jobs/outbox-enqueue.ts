import type { JobPayload, JobType } from "@mebike/shared/contracts/server/jobs";

import { JobPayloadSchemas } from "@mebike/shared/contracts/server/jobs";

import type { Prisma as PrismaTypes } from "generated/prisma/client";

export type EnqueueOutboxJobArgs<T extends JobType> = {
  readonly type: T;
  readonly payload: JobPayload<T>;
  readonly runAt: Date;
  readonly dedupeKey?: string | null;
};

export async function enqueueOutboxJob<T extends JobType>(
  tx: PrismaTypes.TransactionClient,
  args: EnqueueOutboxJobArgs<T>,
): Promise<void> {
  const payload = JobPayloadSchemas[args.type].parse(args.payload) as JobPayload<T>;
  await tx.jobOutbox.create({
    data: {
      type: args.type,
      dedupeKey: args.dedupeKey ?? null,
      payload,
      runAt: args.runAt,
    },
  });
}
