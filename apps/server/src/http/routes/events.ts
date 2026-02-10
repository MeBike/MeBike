import type { OpenAPIHono } from "@hono/zod-openapi";

import { streamSSE } from "hono/streaming";

import { getBikeStatusEventBus } from "@/realtime/bike-status-events";

type StreamWriter = {
  writeSSE: (input: { data: string; event?: string }) => Promise<void> | void;
};

const connections = new Map<string, Set<StreamWriter>>();
const eventBus = getBikeStatusEventBus();

eventBus.on("bikeStatusUpdate", (payload: { userId: string }) => {
  const targets = connections.get(payload.userId);
  if (!targets || targets.size === 0) {
    return;
  }
  const data = JSON.stringify(payload);
  for (const writer of targets) {
    void writer.writeSSE({ event: "bikeStatusUpdate", data });
  }
});

export function registerEventRoutes(app: OpenAPIHono) {
  app.get("/events", (c) => {
    const user = c.var.currentUser!;
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    return streamSSE(c, async (s) => {
      const userId = user.userId;
      const userConnections = connections.get(userId) ?? new Set<StreamWriter>();
      userConnections.add(s);
      connections.set(userId, userConnections);

      await s.writeSSE({ event: "ready", data: "Connection established" });

      const heartbeat = setInterval(() => {
        void s.writeSSE({ event: "ping", data: "keepalive" });
      }, 25_000);

      const waitForAbort = new Promise<void>((resolve) => {
        s.onAbort(() => resolve());
      });

      await waitForAbort;

      clearInterval(heartbeat);
      userConnections.delete(s);
      if (userConnections.size === 0) {
        connections.delete(userId);
      }
    });
  });
}
