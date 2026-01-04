import type { JobType } from "./job-types";

import { z } from "../../../zod";
import { JobTypes } from "./job-types";

const EmailSendRawPayloadV1Schema = z.object({
  version: z.literal(1),
  kind: z.literal("raw"),
  to: z.string().min(1),
  subject: z.string().min(1),
  html: z.string().min(1),
  from: z.string().min(1).optional(),
});

const EmailSendVerifyOtpPayloadV1Schema = z.object({
  version: z.literal(1),
  kind: z.literal("auth.verifyOtp"),
  to: z.string().min(1),
  fullName: z.string().min(1),
  otp: z.string().min(1),
  expiresInMinutes: z.number().int().positive(),
  from: z.string().min(1).optional(),
});

const EmailSendResetOtpPayloadV1Schema = z.object({
  version: z.literal(1),
  kind: z.literal("auth.resetOtp"),
  to: z.string().min(1),
  fullName: z.string().min(1),
  otp: z.string().min(1),
  expiresInMinutes: z.number().int().positive(),
  from: z.string().min(1).optional(),
});

const EmailSendPayloadV1Schema = z.discriminatedUnion("kind", [
  EmailSendRawPayloadV1Schema,
  EmailSendVerifyOtpPayloadV1Schema,
  EmailSendResetOtpPayloadV1Schema,
]);

const SubscriptionAutoActivatePayloadV1Schema = z.object({
  version: z.literal(1),
  subscriptionId: z.uuidv7(),
});

const SubscriptionExpireSweepPayloadV1Schema = z.object({
  version: z.literal(1),
});

const ReservationFixedSlotAssignPayloadV1Schema = z.object({
  version: z.literal(1),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const ReservationNotifyNearExpiryPayloadV1Schema = z.object({
  version: z.literal(1),
  reservationId: z.uuidv7(),
});

const ReservationExpireHoldPayloadV1Schema = z.object({
  version: z.literal(1),
  reservationId: z.uuidv7(),
});

const WalletWithdrawalExecutePayloadV1Schema = z.object({
  version: z.literal(1),
  withdrawalId: z.uuidv7(),
});

/**
 * NOTE(timezone): `slotDate` is a date-only key (YYYY-MM-DD), not an instant timestamp.
 *
 * - It exists to keep the job idempotent and avoid passing ambiguous DateTimes across producers/consumers.
 * - Consumers must interpret `slotDate` consistently. For MeBike we assume a single "business timezone"
 *   (typically `Asia/Ho_Chi_Minh`) for "which day is today?" semantics.
 *
 * If the system ever supports multiple timezones, consider evolving the payload to include an explicit
 * `timeZone` (IANA string) and/or switching to a versioned job type (e.g. `reservations.fixedSlotAssign.v2`)
 * with a stricter representation.
 */

export const JobPayloadSchemas = {
  [JobTypes.EmailSend]: EmailSendPayloadV1Schema,
  [JobTypes.SubscriptionAutoActivate]: SubscriptionAutoActivatePayloadV1Schema,
  [JobTypes.SubscriptionExpireSweep]: SubscriptionExpireSweepPayloadV1Schema,
  [JobTypes.ReservationFixedSlotAssign]: ReservationFixedSlotAssignPayloadV1Schema,
  [JobTypes.ReservationNotifyNearExpiry]: ReservationNotifyNearExpiryPayloadV1Schema,
  [JobTypes.ReservationExpireHold]: ReservationExpireHoldPayloadV1Schema,
  [JobTypes.WalletWithdrawalExecute]: WalletWithdrawalExecutePayloadV1Schema,
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
