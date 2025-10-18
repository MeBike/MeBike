import process from "node:process";
import pino from "pino";

const isDev = (process.env.NODE_ENV || "development") !== "production";

const transports: any = isDev
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        ignore: "pid,hostname",
        translateTime: "SYS:standard",
      },
    }
  : undefined;

const logLevel = process.env.LOG_LEVEL || (isDev ? "debug" : "info");

const logger = pino({ level: logLevel, base: { service: "iot-service" } }, transports ? pino.transport(transports) : undefined);

export function getLogger() {
  return logger;
}

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

export default logger;
