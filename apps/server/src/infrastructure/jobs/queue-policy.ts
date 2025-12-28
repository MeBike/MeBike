import type { QueueOptions } from "pg-boss";

import type { JobType } from "./job-types";

import { JobTypes } from "./job-types";

export type QueueOptionsWithDeadLetter = QueueOptions & { deadLetter?: string };

export const JobDeadLetters: Partial<Record<JobType, string>> = {
  [JobTypes.EmailSend]: "emails.dlq",
  [JobTypes.SubscriptionAutoActivate]: "subscriptions.autoActivate.dlq",
  [JobTypes.ReservationFixedSlotAssign]: "reservations.fixedSlotAssign.dlq",
};

export function listDlqQueues(): readonly string[] {
  return Object.values(JobDeadLetters).filter(
    (queue): queue is string => typeof queue === "string",
  );
}

const DEFAULT_QUEUE_OPTIONS: Record<JobType, QueueOptionsWithDeadLetter> = {
  [JobTypes.EmailSend]: {
    retryLimit: 10,
    retryDelay: 30,
    retryBackoff: true,
    retryDelayMax: 15 * 60,
    deadLetter: JobDeadLetters[JobTypes.EmailSend],
  },
  [JobTypes.SubscriptionAutoActivate]: {
    retryLimit: 10,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 60 * 60,
    deadLetter: JobDeadLetters[JobTypes.SubscriptionAutoActivate],
  },
  [JobTypes.SubscriptionExpireSweep]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
  [JobTypes.ReservationFixedSlotAssign]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
    deadLetter: JobDeadLetters[JobTypes.ReservationFixedSlotAssign],
  },
};

export function resolveQueueOptions(
  type: JobType,
  overrides?: QueueOptionsWithDeadLetter,
): QueueOptionsWithDeadLetter {
  return {
    ...DEFAULT_QUEUE_OPTIONS[type],
    ...overrides,
  };
}
