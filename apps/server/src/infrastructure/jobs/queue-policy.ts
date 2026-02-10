import type { QueueOptions } from "pg-boss";

import { env } from "@/config/env";

import type { JobType } from "./job-types";

import { JobTypes } from "./job-types";

export type QueueOptionsWithDeadLetter = QueueOptions & { deadLetter?: string };

export const JobDeadLetters: Partial<Record<JobType, string>> = {
  [JobTypes.EmailSend]: "emails.dlq",
  [JobTypes.SubscriptionAutoActivate]: "subscriptions.autoActivate.dlq",
  [JobTypes.ReservationFixedSlotAssign]: "reservations.fixedSlotAssign.dlq",
  [JobTypes.ReservationNotifyNearExpiry]: "reservations.notifyNearExpiry.dlq",
  [JobTypes.ReservationExpireHold]: "reservations.expireHold.dlq",
  [JobTypes.WalletWithdrawalExecute]: "wallets.withdraw.execute.dlq",
  [JobTypes.WalletWithdrawalSweep]: "wallets.withdraw.sweep.dlq",
};

export function listDlqQueues(): readonly string[] {
  return Object.values(JobDeadLetters).filter(
    (queue): queue is string => typeof queue === "string",
  );
}

const WITHDRAWAL_EXECUTE_RETRY_DELAY_SECONDS = 60;
const WITHDRAWAL_EXECUTE_RETRY_LIMIT = Math.max(
  1,
  Math.ceil((env.WITHDRAWAL_SLA_MINUTES * 60) / WITHDRAWAL_EXECUTE_RETRY_DELAY_SECONDS),
);

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
  [JobTypes.ReservationNotifyNearExpiry]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
    deadLetter: JobDeadLetters[JobTypes.ReservationNotifyNearExpiry],
  },
  [JobTypes.ReservationExpireHold]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
    deadLetter: JobDeadLetters[JobTypes.ReservationExpireHold],
  },
  [JobTypes.WalletWithdrawalExecute]: {
    retryLimit: WITHDRAWAL_EXECUTE_RETRY_LIMIT,
    retryDelay: WITHDRAWAL_EXECUTE_RETRY_DELAY_SECONDS,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
    deadLetter: JobDeadLetters[JobTypes.WalletWithdrawalExecute],
  },
  [JobTypes.WalletWithdrawalSweep]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
    deadLetter: JobDeadLetters[JobTypes.WalletWithdrawalSweep],
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
