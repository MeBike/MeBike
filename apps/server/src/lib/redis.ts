import Redis from "ioredis";

import { env } from "@/config/env";

export function makeRedisClient(): Redis {
  const url = env.REDIS_URL ?? "redis://localhost:6379";
  return new Redis(url);
}
