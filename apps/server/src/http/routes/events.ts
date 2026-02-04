import type { OpenAPIHono } from "@hono/zod-openapi";

import { stream } from "hono/streaming";

import { getBikeStatusEventBus } from "@/realtime/bike-status-events";

export function registerEventRoutes(app: OpenAPIHono) {
  app.get("/events", (c) => {
    const user = c.var.currentUser!;
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    return stream(c, async (s) => {
      const eventBus = getBikeStatusEventBus();
      const handleUpdate = (payload: { userId: string }) => {
        if (payload.userId !== user.userId) {
          return;
        }
        s.write(`event: bikeStatusUpdate\ndata: ${JSON.stringify(payload)}\n\n`);
      };

      eventBus.on("bikeStatusUpdate", handleUpdate);
      s.write("event: open\ndata: Connection established\n\n");

      const heartbeat = setInterval(() => {
        s.write("event: ping\ndata: keepalive\n\n");
      }, 25_000);

      s.onAbort(() => {
        clearInterval(heartbeat);
        eventBus.off("bikeStatusUpdate", handleUpdate);
      });
    });
  });
}
