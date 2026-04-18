import dotenv from "dotenv";
import { env as processEnv } from "node:process";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  IOT_MQTT_URL: z.string().default("mqtt://localhost:1883"),
  IOT_MQTT_USERNAME: z.string().optional(),
  IOT_MQTT_PASSWORD: z.string().optional(),
  EMAIL_APP: z.string().min(1, "EMAIL_APP is required"),
  EMAIL_PASSWORD_APP: z.string().min(1, "EMAIL_PASSWORD_APP is required"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_SITE_URL: z.string().url().optional(),
  OPENROUTER_APP_NAME: z.string().default("MeBike"),
  AI_MODEL: z.string().default("openai/gpt-5.3-chat"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).default(10),
  LOG_LEVEL: z.string().default("info"),
  MIN_WITHDRAWAL_AMOUNT: z.coerce.number().default(5),
  WITHDRAWAL_PROCESSING_TTL_MINUTES: z.coerce.number().default(10),
  WITHDRAWAL_SLA_MINUTES: z.coerce.number().default(5),
  WITHDRAWAL_SWEEP_CRON: z.string().default("*/5 * * * *"),
  STATION_CAPACITY_LIMIT: z.coerce.number().int().min(1).default(40),
  RESERVATION_HOLD_MINUTES: z.coerce.number().default(30),
  EXPIRY_NOTIFY_MINUTES: z.coerce.number().default(15),
  REFUND_PERIOD_HOURS: z.coerce.number().default(24),
  FIXED_SLOT_ASSIGN_CRON: z.string().default("0 0 * * *"),
  // Legacy semantics: each subscription "usage" covers this many hours of rental time.
  SUB_HOURS_PER_USED: z.coerce.number().default(10),
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
