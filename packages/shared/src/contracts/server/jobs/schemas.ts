import { z } from "zod";

import type { JobType } from "./job-types";

import { JobTypes } from "./job-types";

const EmailSendPayloadV1Schema = z.object({
  version: z.literal(1),
  to: z.string().min(1),
  subject: z.string().min(1),
  html: z.string().min(1),
  from: z.string().min(1).optional(),
});

const SubscriptionAutoActivatePayloadV1Schema = z.object({
  version: z.literal(1),
  subscriptionId: z.string().min(1),
});

const SubscriptionExpireSweepPayloadV1Schema = z.object({
  version: z.literal(1),
});

export const JobPayloadSchemas = {
  [JobTypes.EmailSend]: EmailSendPayloadV1Schema,
  [JobTypes.SubscriptionAutoActivate]: SubscriptionAutoActivatePayloadV1Schema,
  [JobTypes.SubscriptionExpireSweep]: SubscriptionExpireSweepPayloadV1Schema,
} as const;

export type JobPayload<T extends JobType> = z.infer<(typeof JobPayloadSchemas)[T]>;

export type JobPayloads = {
  [K in JobType]: z.infer<(typeof JobPayloadSchemas)[K]>;
};

export function parseJobPayload<T extends JobType>(
  type: T,
  payload: unknown,
): JobPayload<T> {
  return JobPayloadSchemas[type].parse(payload) as JobPayload<T>;
}

export function safeParseJobPayload<T extends JobType>(
  type: T,
  payload: unknown,
): ReturnType<(typeof JobPayloadSchemas)[T]["safeParse"]> {
  return JobPayloadSchemas[type].safeParse(payload) as ReturnType<
    (typeof JobPayloadSchemas)[T]["safeParse"]
  >;
}
