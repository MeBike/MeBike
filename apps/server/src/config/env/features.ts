import { z } from "zod";

export const authEnvSchema = z.object({
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).default(10),
});

export const walletEnvSchema = z.object({
  MIN_WITHDRAWAL_AMOUNT: z.coerce.number().default(5),
  WITHDRAWAL_PROCESSING_TTL_MINUTES: z.coerce.number().default(10),
  WITHDRAWAL_SLA_MINUTES: z.coerce.number().default(5),
  WITHDRAWAL_SWEEP_CRON: z.string().default("*/5 * * * *"),
});

export const stationEnvSchema = z.object({
  STATION_CAPACITY_LIMIT: z.coerce.number().int().min(1).default(40),
});

export const reservationEnvSchema = z.object({
  RESERVATION_HOLD_MINUTES: z.coerce.number().default(30),
  EXPIRY_NOTIFY_MINUTES: z.coerce.number().default(15),
  REFUND_PERIOD_HOURS: z.coerce.number().default(24),
});

export const fixedSlotEnvSchema = z.object({
  FIXED_SLOT_ASSIGN_CRON: z.string().default("0 0 * * *"),
});

export const subscriptionEnvSchema = z.object({
  // Legacy semantics: each subscription "usage" covers this many hours of rental time.
  SUB_HOURS_PER_USED: z.coerce.number().default(10),
  EXPIRE_AFTER_DAYS: z.coerce.number().default(30),
  AUTO_ACTIVATE_IN_DAYS: z.coerce.number().default(10),
});
