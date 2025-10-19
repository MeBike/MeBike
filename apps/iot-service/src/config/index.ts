import dotenv from "dotenv";
import { env as processEnv } from "node:process";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  LOGIN_USERNAME: z.string(),
  LOGIN_PASSWORD: z.string(),
  MQTT_URL: z.string(),
  MQTT_USERNAME: z.string(),
  MQTT_PASSWORD: z.string(),
  DEVICE_MAC: z.string().optional(),
  STATE_STEP_DELAY_MS: z.string(),
  STATE_TIMEOUT_MS: z.string(),
  STATE_SEQUENCE: z.string().optional(),
  HTTP_PORT: z.coerce.number().default(3000),
  HTTP_HOST: z.string().default("0.0.0.0"),
  BACKEND_API_URL: z.string().url().default("http://localhost:4000"),
  CARD_TAP_API_KEY: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(processEnv);
