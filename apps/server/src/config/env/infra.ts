import { z } from "zod";

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

export const redisEnvSchema = z.object({
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

export const iotEnvSchema = z.object({
  IOT_MQTT_URL: z.string().default("mqtt://localhost:1883"),
  IOT_MQTT_USERNAME: z.string().optional(),
  IOT_MQTT_PASSWORD: z.string().optional(),
});

export const emailEnvSchema = z.object({
  EMAIL_APP: z.string().min(1, "EMAIL_APP is required"),
  EMAIL_PASSWORD_APP: z.string().min(1, "EMAIL_PASSWORD_APP is required"),
});

export const firebaseEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

export const mapboxEnvSchema = z.object({
  MAPBOX_ACCESS_TOKEN: z.string().optional(),
});

export const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});
