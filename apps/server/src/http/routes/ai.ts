import { serverRoutes } from "@mebike/shared";

import { AiController } from "@/http/controllers/ai";

export function registerAiRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  app.openapi(serverRoutes.ai.chat, AiController.chat);
}
