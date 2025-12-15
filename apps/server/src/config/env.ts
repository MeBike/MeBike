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
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  LOG_LEVEL: z.string().default("info"),
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
