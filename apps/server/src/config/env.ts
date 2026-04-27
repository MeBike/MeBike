import "dotenv/config";
import { env as processEnv } from "node:process";
import { z } from "zod";

import { aiEnvSchema } from "./env/ai";
import { appEnvSchema } from "./env/app";
import {
  authEnvSchema,
  fixedSlotEnvSchema,
  reservationEnvSchema,
  returnSlotEnvSchema,
  stationEnvSchema,
  subscriptionEnvSchema,
  walletEnvSchema,
} from "./env/features";
import {
  databaseEnvSchema,
  emailEnvSchema,
  firebaseEnvSchema,
  iotEnvSchema,
  mapboxEnvSchema,
  redisEnvSchema,
  stripeEnvSchema,
} from "./env/infra";

const envSchema = z.object({
  ...appEnvSchema.shape,
  ...databaseEnvSchema.shape,
  ...redisEnvSchema.shape,
  ...iotEnvSchema.shape,
  ...emailEnvSchema.shape,
  ...firebaseEnvSchema.shape,
  ...mapboxEnvSchema.shape,
  ...stripeEnvSchema.shape,
  ...aiEnvSchema.shape,
  ...authEnvSchema.shape,
  ...walletEnvSchema.shape,
  ...stationEnvSchema.shape,
  ...reservationEnvSchema.shape,
  ...returnSlotEnvSchema.shape,
  ...fixedSlotEnvSchema.shape,
  ...subscriptionEnvSchema.shape,
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
