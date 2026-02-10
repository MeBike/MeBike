import pino from "pino";

import { env } from "@/config/env";

const isDev = env.NODE_ENV !== "production";

const logLevel = env.LOG_LEVEL || (isDev ? "debug" : "info");

const logger = pino({
  level: logLevel,
  base: { service: "server" },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined,
});

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

export default logger;
