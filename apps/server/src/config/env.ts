import dotenv from "dotenv";
import { env as processEnv } from "node:process";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  EMAIL_APP: z.string().min(1, "EMAIL_APP is required"),
  EMAIL_PASSWORD_APP: z.string().min(1, "EMAIL_PASSWORD_APP is required"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  LOG_LEVEL: z.string().default("info"),
  MIN_WITHDRAWAL_AMOUNT: z.coerce.number().default(5),
  WITHDRAWAL_PROCESSING_TTL_MINUTES: z.coerce.number().default(10),
  WITHDRAWAL_SLA_MINUTES: z.coerce.number().default(5),
  WITHDRAWAL_SWEEP_CRON: z.string().default("*/5 * * * *"),
  MIN_WALLET_BALANCE_TO_RENT: z.coerce.number().default(2000),
  RESERVATION_HOLD_MINUTES: z.coerce.number().default(30),
  RESERVATION_PREPAID_AMOUNT: z.coerce.number().default(2000),
  EXPIRY_NOTIFY_MINUTES: z.coerce.number().default(15),
  REFUND_PERIOD_HOURS: z.coerce.number().default(24),
  FIXED_SLOT_ASSIGN_CRON: z.string().default("0 0 * * *"),
  PRICE_PER_30_MINS: z.coerce.number().default(2000),
  RENTAL_PENALTY_HOURS: z.coerce.number().default(24),
  RENTAL_PENALTY_AMOUNT: z.coerce.number().default(50000),
  EXPIRE_AFTER_DAYS: z.coerce.number().default(30),
  AUTO_ACTIVATE_IN_DAYS: z.coerce.number().default(10),
});

export type Env = z.infer<typeof envSchema>;

const isTest = processEnv.NODE_ENV === "test" || processEnv.VITEST === "true";

const testDefaults = isTest
  ? {
      DATABASE_URL: "postgres://placeholder.test",
      EMAIL_APP: "test@example.com",
      EMAIL_PASSWORD_APP: "password",
      JWT_SECRET: "secret",
    }
  : {};

export const env: Env = envSchema.parse({
  ...testDefaults,
  ...processEnv,
});
