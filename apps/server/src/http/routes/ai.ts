import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { AiController } from "@/http/controllers/ai";
import { requireAuthMiddleware } from "@/http/middlewares/auth";

export function registerAiRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const chatRoute = {
    ...serverRoutes.ai.chat,
    middleware: [requireAuthMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(chatRoute, AiController.chat);
}
