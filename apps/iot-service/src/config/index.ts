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
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(processEnv);
