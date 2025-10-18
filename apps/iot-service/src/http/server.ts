import type { OpenAPIHono } from "@hono/zod-openapi";
import type { AddressInfo } from "node:net";

import { serve } from "@hono/node-server";

import defaultLogger from "../lib/logger";

export type HttpServer = ReturnType<typeof serve>;

export type StartHttpServerOptions = {
  port: number;
  hostname?: string;
  logger?: Pick<typeof defaultLogger, "info" | "error">;
};

export function startHttpServer(
  app: OpenAPIHono,
  { port, hostname, logger = defaultLogger }: StartHttpServerOptions,
): HttpServer {
  const server = serve(
    {
      fetch: app.fetch,
      port,
      hostname,
    },
    (info: AddressInfo) => {
      const resolvedHost = hostname ?? normalizeListeningAddress(info.address);
      logger.info?.(
        `HTTP server listening on http://${resolvedHost}:${info.port}`,
      );
    },
  );

  server.on("error", (error) => {
    logger.error?.("HTTP server error:", error);
  });

  return server;
}

function normalizeListeningAddress(address: string): string {
  if (address === "::") {
    return "localhost";
  }

  return address;
}
