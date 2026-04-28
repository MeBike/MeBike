import { env } from "@/config/env";

import type { JobType } from "./job-types";
import type { JobQueueOptions } from "./ports";

import { JobTypes } from "./job-types";

const WITHDRAWAL_EXECUTE_RETRY_DELAY_SECONDS = 60;
const WITHDRAWAL_EXECUTE_RETRY_LIMIT = Math.max(
  1,
  Math.ceil((env.WITHDRAWAL_SLA_MINUTES * 60) / WITHDRAWAL_EXECUTE_RETRY_DELAY_SECONDS),
);

const DEFAULT_QUEUE_OPTIONS: Record<JobType, JobQueueOptions> = {
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
  [JobTypes.ReservationFixedSlotAssign]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
  [JobTypes.ReservationNotifyNearExpiry]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
  [JobTypes.ReservationExpireHold]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
  [JobTypes.ReturnSlotExpireSweep]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
  [JobTypes.EnvironmentImpactCalculateRental]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
  [JobTypes.RentalOverdueSweep]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
  [JobTypes.WalletTopupReconcileSweep]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
  [JobTypes.WalletWithdrawalExecute]: {
    retryLimit: WITHDRAWAL_EXECUTE_RETRY_LIMIT,
    retryDelay: WITHDRAWAL_EXECUTE_RETRY_DELAY_SECONDS,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
  [JobTypes.WalletWithdrawalSweep]: {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    retryDelayMax: 10 * 60,
  },
};

export function resolveQueueOptions(
  type: JobType,
  overrides?: JobQueueOptions,
): JobQueueOptions {
  return {
    ...DEFAULT_QUEUE_OPTIONS[type],
    ...overrides,
  };
}
