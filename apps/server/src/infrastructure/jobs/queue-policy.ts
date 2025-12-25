import type { QueueOptions } from "pg-boss";

import type { JobType } from "./job-types";

import { JobTypes } from "./job-types";

const DEFAULT_QUEUE_OPTIONS: Record<JobType, QueueOptions> = {
  [JobTypes.EmailSend]: {
    retryLimit: 10,
    retryDelay: 30,
    retryBackoff: true,
    retryDelayMax: 15 * 60,
  },
  [JobTypes.SubscriptionAutoActivate]: {
    retryLimit: 10,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 60 * 60,
  },
  [JobTypes.SubscriptionExpireSweep]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
};

export function resolveQueueOptions(
  type: JobType,
  overrides?: QueueOptions,
): QueueOptions {
  return {
    ...DEFAULT_QUEUE_OPTIONS[type],
    ...overrides,
  };
}
