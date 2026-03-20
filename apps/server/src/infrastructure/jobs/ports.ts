import type { JobPayload, JobType } from "@mebike/shared/contracts/server/jobs";

export type EnqueueJobOptions = {
  readonly dedupeKey?: string;
};

export type JobQueueOptions = {
  readonly retryLimit?: number;
  readonly retryDelay?: number;
  readonly retryBackoff?: boolean;
  readonly retryDelayMax?: number;
  readonly deadLetter?: string;
};

export type QueueJob<TData = unknown> = {
  readonly id: string;
  readonly data: TData;
};

export type JobProducer = {
  send: <T extends JobType>(
    type: T,
    payload: JobPayload<T>,
    options?: EnqueueJobOptions,
  ) => Promise<string | null>;
};

export type JobRuntime = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  stopGracefully: (timeoutMs?: number) => Promise<void>;
  onError: (handler: (error: unknown) => void) => void;
  onWarning: (handler: (warning: unknown) => void) => void;
  ensureQueue: (queue: string, options?: JobQueueOptions) => Promise<void>;
  register: (
    queue: string,
    handler: (job: QueueJob | undefined) => Promise<void>,
  ) => Promise<string>;
  fetchOne: (queue: string) => Promise<QueueJob | undefined>;
  complete: (queue: string, jobId: string) => Promise<void>;
  fail: (queue: string, jobId: string, error: string) => Promise<void>;
};

export type JobScheduler = {
  schedule: <T extends JobType>(
    type: T,
    cron: string,
    payload: JobPayload<T>,
  ) => Promise<void>;
};
