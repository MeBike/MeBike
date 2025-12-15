import Redis from "ioredis";
import process from "node:process";

export function makeRedisClient(): Redis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new Redis(url);
}
